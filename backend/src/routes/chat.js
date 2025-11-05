import express from 'express';
import prismaPackage from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import chromaService from '../services/chromaService.js';
import { callChatCompletion } from '../services/llmService.js';
import {
    detectIntentFromText,
    resolveIntent,
    DEFAULT_INTENT,
} from '../config/chatPrompts.js';

const { PrismaClient } = prismaPackage;
const PrismaEnums = prismaPackage.$Enums || {};

const RolMensaje = PrismaEnums.RolMensaje || {
    USUARIO: 'USUARIO',
    ASISTENTE: 'ASISTENTE',
    SISTEMA: 'SISTEMA',
};

const router = express.Router();
const prisma = new PrismaClient();
const FALLBACK_MESSAGE = 'Lo siento, ahora mismo no puedo generar una propuesta. Estoy revisando el sistema; inténtalo de nuevo en unos minutos.';

function mapRoleToOpenAI(role) {
    switch (role) {
        case RolMensaje.ASISTENTE:
            return 'assistant';
        case RolMensaje.SISTEMA:
            return 'system';
        case RolMensaje.USUARIO:
        default:
            return 'user';
    }
}

function mapOpenAIRoleToPrisma(role) {
    if (role === 'assistant') return RolMensaje.ASISTENTE;
    if (role === 'system') return RolMensaje.SISTEMA;
    return RolMensaje.USUARIO;
}

function buildConversationTitle(conversation) {
    if (conversation?.titulo) {
        return conversation.titulo;
    }

    if (conversation?.descripcion) {
        const clean = conversation.descripcion.trim();
        if (clean.length > 0) {
            return clean.slice(0, 48) + (clean.length > 48 ? '…' : '');
        }
    }

    const date = conversation?.fechaCreacion instanceof Date
        ? conversation.fechaCreacion
        : new Date(conversation?.fechaCreacion || Date.now());

    return `Conversación ${date.toLocaleDateString('es-ES')}`;
}

function sanitizeConversation(conversation) {
    return {
        id: conversation.id,
        titulo: buildConversationTitle(conversation),
        descripcion: conversation.descripcion,
        intencionPrincipal: conversation.intencionPrincipal || DEFAULT_INTENT.id,
        fechaCreacion: conversation.fechaCreacion,
        fechaActualizacion: conversation.fechaActualizacion,
    };
}

function sanitizeMessage(message) {
    return {
        id: message.id,
        role: mapRoleToOpenAI(message.rol),
        content: message.contenido,
        intencion: message.intencion,
        fechaCreacion: message.fechaCreacion,
    };
}

function buildContextFromChroma(results = []) {
    if (!Array.isArray(results) || results.length === 0) {
        return '';
    }

    const limited = results.slice(0, 4);
    const sections = limited.map((item, index) => {
        const title = item?.metadata?.titulo || `Fragmento ${index + 1}`;
        const etiquetas = Array.isArray(item?.metadata?.etiquetas)
            ? `Etiquetas: ${item.metadata.etiquetas.join(', ')}`
            : '';
        const source = item?.metadata?.nombreOriginal || item?.metadata?.documentoId || item?.id;
        const fragment = (item?.document || '').trim().slice(0, 1200);
        return [`### Fuente: ${title}`, etiquetas, fragment, `Referencia: ${source}`]
            .filter((value) => value && value.length > 0)
            .join('\n');
    });

    return `Contexto documental relevante:\n\n${sections.join('\n\n')}\n\nUsa estas referencias para complementar la respuesta sin copiar literalmente. No inventes datos.`;
}

function logChatEvent(level = 'info', payload = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        source: 'chat-api',
        ...payload,
    };

    if (level === 'error') {
        console.error(entry);
    } else if (level === 'warn') {
        console.warn(entry);
    } else {
        console.info(entry);
    }
}

async function ensureConversation({ conversationId, userId, intent }) {
    if (conversationId) {
        const existing = await prisma.conversacion.findUnique({
            where: { id: conversationId },
        });

        if (existing) {
            if (existing.usuarioId && existing.usuarioId !== userId) {
                throw new Error('No tienes acceso a esta conversación');
            }
            return existing;
        }
    }

    return prisma.conversacion.create({
        data: {
            usuarioId: userId,
            titulo: null,
            descripcion: null,
            intencionPrincipal: intent?.id || DEFAULT_INTENT.id,
        },
    });
}

async function fetchConversationHistory(conversationId, limit = 12) {
    const messages = await prisma.mensajeConversacion.findMany({
        where: { conversacionId: conversationId },
        orderBy: { fechaCreacion: 'desc' },
        take: limit,
    });

    return messages
        .reverse()
        .map((msg) => ({
            role: mapRoleToOpenAI(msg.rol),
            content: msg.contenido,
        }));
}

router.get('/', authenticate, async (req, res) => {
    try {
        const conversations = await prisma.conversacion.findMany({
            where: {
                OR: [
                    { usuarioId: req.user?.id || null },
                    { usuarioId: null },
                ],
            },
            orderBy: { fechaActualizacion: 'desc' },
            take: 30,
        });

        return res.json({
            conversations: conversations.map(sanitizeConversation),
        });
    } catch (error) {
        console.error('❌ Error listando conversaciones:', error);
        return res.status(500).json({
            error: 'Error listando conversaciones',
            message: error.message,
        });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const conversation = await prisma.conversacion.findUnique({
            where: { id },
        });

        if (!conversation) {
            return res.status(404).json({
                error: 'Conversación no encontrada',
            });
        }

        if (conversation.usuarioId && conversation.usuarioId !== req.user?.id) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'No puedes acceder a esta conversación',
            });
        }

        const messages = await prisma.mensajeConversacion.findMany({
            where: { conversacionId: id },
            orderBy: { fechaCreacion: 'asc' },
        });

        return res.json({
            conversation: sanitizeConversation(conversation),
            messages: messages.map(sanitizeMessage),
        });
    } catch (error) {
        console.error('❌ Error obteniendo conversación:', error);
        return res.status(500).json({
            error: 'Error obteniendo conversación',
            message: error.message,
        });
    }
});

router.post('/', authenticate, async (req, res) => {
    const { message, conversationId, intent: rawIntent } = req.body || {};

    let conversation = null;
    let detectedIntent = DEFAULT_INTENT;
    let userMessageRecord = null;
    let contextResults = [];

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
            error: 'Mensaje inválido',
            message: 'Debes proporcionar un mensaje de usuario',
        });
    }

    try {
        const trimmedMessage = message.trim();
        detectedIntent = rawIntent
            ? resolveIntent(rawIntent)
            : detectIntentFromText(trimmedMessage);

        conversation = await ensureConversation({
            conversationId,
            userId: req.user?.id || null,
            intent: detectedIntent,
        });

        const previousHistory = await fetchConversationHistory(conversation.id, 12);
        userMessageRecord = await prisma.mensajeConversacion.create({
            data: {
                conversacionId: conversation.id,
                rol: RolMensaje.USUARIO,
                contenido: trimmedMessage,
                intencion: detectedIntent.id,
            },
        });

        contextResults = await chromaService.searchSimilar(
            trimmedMessage,
            5,
            detectedIntent?.chromaCollection,
        );

        const contextPrompt = buildContextFromChroma(contextResults);

        const llmMessages = [
            { role: 'system', content: detectedIntent.systemPrompt },
        ];

        if (contextPrompt) {
            llmMessages.push({ role: 'system', content: contextPrompt });
        }

        if (previousHistory.length > 0) {
            llmMessages.push(...previousHistory);
        }

        llmMessages.push({ role: 'user', content: trimmedMessage });

        let llmResponse;
        try {
            llmResponse = await callChatCompletion({
                messages: llmMessages,
            });
        } catch (error) {
            throw new Error(`El modelo no pudo generar una respuesta: ${error.message}`);
        }

        const durationMs = typeof llmResponse.durationMs === 'number'
            ? llmResponse.durationMs
            : null;
        const assistantMessageRecord = await prisma.mensajeConversacion.create({
            data: {
                conversacionId: conversation.id,
                rol: RolMensaje.ASISTENTE,
                contenido: llmResponse.content,
                intencion: detectedIntent.id,
                tokensEntrada: llmResponse.usage?.prompt_tokens || null,
                tokensSalida: llmResponse.usage?.completion_tokens || null,
                duracionMs: durationMs,
                metadatos: {
                    chromaResults: contextResults.map((item) => ({
                        id: item.id,
                        metadata: item.metadata || null,
                        distance: item.distance ?? null,
                    })),
                    llmRaw: llmResponse.raw,
                    userMessageId: userMessageRecord.id,
                    attempts: llmResponse.attempts || 1,
                },
            },
        });

        await prisma.conversacion.update({
            where: { id: conversation.id },
            data: {
                intencionPrincipal: detectedIntent.id,
                descripcion: conversation.descripcion || trimmedMessage.slice(0, 200),
            },
        });

        logChatEvent('info', {
            event: 'chat.completion.success',
            conversationId: conversation.id,
            userId: req.user?.id || null,
            intent: detectedIntent.id,
            durationMs: durationMs,
            attempts: llmResponse.attempts || 1,
            tokensEntrada: llmResponse.usage?.prompt_tokens || null,
            tokensSalida: llmResponse.usage?.completion_tokens || null,
            contextDocuments: contextResults.length,
        });

        return res.json({
            conversationId: conversation.id,
            intent: detectedIntent.id,
            message: {
                role: 'assistant',
                content: assistantMessageRecord.contenido,
            },
            usage: llmResponse.usage || null,
        });
    } catch (error) {
        console.error('❌ Error en /api/chat:', error);

        if (!conversation || !userMessageRecord) {
            return res.status(500).json({
                error: 'Error generando respuesta',
                message: error.message,
            });
        }

        let assistantMessageRecord = null;
        try {
            assistantMessageRecord = await prisma.mensajeConversacion.create({
                data: {
                    conversacionId: conversation.id,
                    rol: RolMensaje.ASISTENTE,
                    contenido: FALLBACK_MESSAGE,
                    intencion: detectedIntent.id,
                    tokensEntrada: null,
                    tokensSalida: null,
                    duracionMs: null,
                    metadatos: {
                        fallback: true,
                        error: error.message,
                        userMessageId: userMessageRecord.id,
                        contextDocuments: contextResults.length,
                    },
                },
            });

            await prisma.conversacion.update({
                where: { id: conversation.id },
                data: {
                    intencionPrincipal: detectedIntent.id,
                    descripcion: conversation.descripcion || message.slice(0, 200),
                },
            });
        } catch (storeError) {
            console.error('❌ Error registrando fallback del chat:', storeError);
        }

        logChatEvent('warn', {
            event: 'chat.completion.fallback',
            conversationId: conversation.id,
            userId: req.user?.id || null,
            intent: detectedIntent.id,
            reason: error.message,
            contextDocuments: contextResults.length,
        });

        return res.status(200).json({
            conversationId: conversation.id,
            intent: detectedIntent.id,
            message: {
                role: 'assistant',
                content: assistantMessageRecord?.contenido || FALLBACK_MESSAGE,
                fallback: true,
            },
            fallback: true,
            error: error.message,
        });
    }
});

router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id || null;

    try {
        const conversation = await prisma.conversacion.findUnique({
            where: { id },
            select: {
                id: true,
                usuarioId: true,
            },
        });

        if (!conversation) {
            return res.status(404).json({
                error: 'Conversación no encontrada',
            });
        }

        if (!conversation.usuarioId || conversation.usuarioId !== userId) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'No puedes eliminar esta conversación',
            });
        }

        await prisma.conversacion.delete({ where: { id } });

        logChatEvent('info', {
            event: 'chat.conversation.deleted',
            conversationId: id,
            userId,
        });

        return res.json({ success: true });
    } catch (error) {
        logChatEvent('error', {
            event: 'chat.conversation.delete.error',
            conversationId: id,
            userId,
            message: error.message,
        });

        return res.status(500).json({
            error: 'No se pudo eliminar la conversación',
            message: error.message,
        });
    }
});

export default router;
