import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import prismaPackage from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';
import chromaService from '../services/chromaService.js';

const { PrismaClient } = prismaPackage;
const PrismaEnums = prismaPackage.$Enums || {};
const EstadoProcesamiento = prismaPackage.EstadoProcesamiento || PrismaEnums.EstadoProcesamiento || {
    PENDIENTE: 'PENDIENTE',
    PROCESANDO: 'PROCESANDO',
    COMPLETADO: 'COMPLETADO',
    ERROR: 'ERROR',
};

const FALLBACK_ETIQUETAS = Object.freeze({
    PROGRAMACIONES: 'PROGRAMACIONES',
    DINAMICAS: 'DINAMICAS',
    ORACIONES: 'ORACIONES',
    REVISTAS: 'REVISTAS',
    CONTENIDO_MIXTO: 'CONTENIDO_MIXTO',
    OTROS: 'OTROS',
});

const EtiquetaDocumento = PrismaEnums.EtiquetaDocumento || FALLBACK_ETIQUETAS;

const prisma = new PrismaClient();
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = process.env.DOCUMENTS_STORAGE_PATH
    ? path.resolve(process.env.DOCUMENTS_STORAGE_PATH)
    : path.resolve(__dirname, '../../storage/documentos');

const CHROMA_DOCUMENT_COLLECTION = process.env.CHROMA_COLLECTION_DOCUMENTOS || 'rpjia-documentos';
const MAX_FILE_SIZE_BYTES = parseInt(process.env.DOCUMENTS_MAX_SIZE || `${20 * 1024 * 1024}`, 10); // 20 MB por defecto
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);
const CHROMA_DOCUMENT_CHUNK_SIZE = parseInt(process.env.CHROMA_DOCUMENT_CHUNK_SIZE || '1500', 10);
const CHROMA_DOCUMENT_CHUNK_OVERLAP = parseInt(process.env.CHROMA_DOCUMENT_CHUNK_OVERLAP || '200', 10);

const ETIQUETAS_DISPONIBLES = Object.values(EtiquetaDocumento);
const ETIQUETA_LABELS = {
    PROGRAMACIONES: 'Programaciones',
    DINAMICAS: 'Dinamicas',
    ORACIONES: 'Oraciones',
    REVISTAS: 'Revistas',
    CONTENIDO_MIXTO: 'Contenido mixto',
    OTROS: 'Otros',
};

let openaiClient = null;
function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }

    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    return openaiClient;
}

function sanitizeFilename(originalName) {
    const extension = path.extname(originalName) || '.pdf';
    const baseName = path.basename(originalName, extension);
    const safeBase = baseName
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .replace(/\s+/g, '-');

    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e6);

    return `${safeBase || 'documento'}-${timestamp}-${randomSuffix}${extension}`;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir(STORAGE_DIR, { recursive: true }, (err) => {
            cb(err, STORAGE_DIR);
        });
    },
    filename: (req, file, cb) => {
        cb(null, sanitizeFilename(file.originalname));
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            cb(new Error('Solo se permiten archivos PDF')); // eslint-disable-line callback-return
            return;
        }
        cb(null, true);
    },
    limits: {
        fileSize: MAX_FILE_SIZE_BYTES,
    },
});

function parseEtiquetas(rawEtiquetas) {
    if (!rawEtiquetas) return [];

    let etiquetas = [];

    if (Array.isArray(rawEtiquetas)) {
        etiquetas = rawEtiquetas;
    } else if (typeof rawEtiquetas === 'string') {
        try {
            const parsed = JSON.parse(rawEtiquetas);
            if (Array.isArray(parsed)) {
                etiquetas = parsed;
            } else {
                etiquetas = rawEtiquetas.split(',');
            }
        } catch (error) {
            etiquetas = rawEtiquetas.split(',');
        }
    }

    const uniqueValues = Array.from(
        new Set(
            etiquetas
                .map((etiqueta) => String(etiqueta).trim().toUpperCase())
                .filter((value) => ETIQUETAS_DISPONIBLES.includes(value)),
        ),
    );

    return uniqueValues;
}

function splitIntoChunks(text, chunkSize, overlap) {
    if (!text) return [];

    const safeChunkSize = Math.max(Number.isFinite(chunkSize) ? chunkSize : 1500, 1);
    const safeOverlap = Math.min(
        Math.max(Number.isFinite(overlap) ? overlap : 0, 0),
        safeChunkSize - 1,
    );

    const chunks = [];
    const length = text.length;
    let start = 0;

    while (start < length) {
        const end = Math.min(start + safeChunkSize, length);
        const fragment = text.slice(start, end).trim();
        if (fragment) {
            chunks.push(fragment);
        }

        if (end >= length) {
            break;
        }

        start = end - safeOverlap;
        if (start < 0) {
            start = 0;
        }
    }

    return chunks;
}

function sanitizeDocument(documento) {
    const etiquetas = Array.isArray(documento.etiquetas) ? documento.etiquetas : [];
    return {
        id: documento.id,
        titulo: documento.titulo,
        nombreOriginal: documento.nombreOriginal,
        rutaArchivo: documento.rutaArchivo,
        tamanoBytes: documento.tamanoBytes,
        tipoMime: documento.tipoMime,
        etiquetas,
        descripcionGenerada: documento.descripcionGenerada,
        estadoProcesamiento: documento.estadoProcesamiento,
        fechaCreacion: documento.fechaCreacion,
        fechaProcesamiento: documento.fechaProcesamiento,
        mensajeError: documento.mensajeError,
    };
}

async function generarDescripcion(titulo, etiquetas, contenido) {
    const texto = contenido.trim();
    const etiquetasLegibles = etiquetas
        .map((etiqueta) => ETIQUETA_LABELS[etiqueta] || etiqueta.toLowerCase())
        .join(', ');

    if (!texto) {
        return `Documento ${titulo} etiquetado como ${etiquetasLegibles || 'sin clasificar'}.`;
    }

    const openai = getOpenAIClient();

    if (openai) {
        try {
            const prompt = [
                'Genera un resumen breve (máximo 3 frases) en castellano para un documento destinado a monitores juveniles.',
                `Etiquetas: ${etiquetasLegibles || 'Sin etiquetas'}.`,
                'Contenido del documento:',
                texto.slice(0, 4000),
            ].join('\n');

            const completion = await openai.responses.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                input: prompt,
                max_output_tokens: 160,
            });

            const outputText = completion?.output?.[0]?.content?.[0]?.text;
            if (outputText) {
                return outputText.trim();
            }
        } catch (error) {
            console.warn('⚠️ No se pudo generar descripción con OpenAI:', error.message);
        }
    }

    const fallback = texto
        .replace(/\s+/g, ' ')
        .split('. ')
        .slice(0, 2)
        .join('. ')
        .trim();

    return fallback || `Documento ${titulo} etiquetado como ${etiquetasLegibles || 'sin clasificar'}.`;
}

async function procesarDocumento({ documento, titulo, etiquetas, filePath, fileBuffer }) {
    const metadataBase = {
        tipo: 'documento',
        etiquetas,
        titulo,
        fechaRegistro: new Date().toISOString(),
        documentoId: documento.id,
        nombreOriginal: documento.nombreOriginal,
        tamanoBytes: documento.tamanoBytes,
        tipoMime: documento.tipoMime,
    };

    let contenidoExtraido = '';

    try {
        const buffer = fileBuffer || (await fs.promises.readFile(filePath));
        const parsed = await pdfParse(buffer);
        contenidoExtraido = parsed.text || '';
    } catch (error) {
        throw new Error(`No se pudo extraer el contenido del PDF: ${error.message}`);
    }

    const contenidoNormalizado = contenidoExtraido
        .replace(/\u0000/g, '')
        .replace(/\r\n/g, '\n')
        .trim();
    const descripcionGenerada = await generarDescripcion(titulo, etiquetas, contenidoNormalizado.slice(0, 8000));

    let vectorOk = false;
    let totalChunks = 0;

    if (contenidoNormalizado) {
        const chunks = splitIntoChunks(
            contenidoNormalizado,
            CHROMA_DOCUMENT_CHUNK_SIZE,
            CHROMA_DOCUMENT_CHUNK_OVERLAP,
        );

        totalChunks = chunks.length;

        if (chunks.length > 0) {
            const entries = chunks.map((chunk, index) => ({
                id: `${documento.id}#${index}`,
                document: chunk,
                metadata: {
                    ...metadataBase,
                    resumen: descripcionGenerada,
                    chunkIndex: index,
                    totalChunks,
                    longitudCaracteres: chunk.length,
                },
            }));

            vectorOk = await chromaService.addDocuments(entries, CHROMA_DOCUMENT_COLLECTION);
        }
    }

    const actualizado = await prisma.documento.update({
        where: { id: documento.id },
        data: {
            descripcionGenerada,
            estadoProcesamiento: EstadoProcesamiento.COMPLETADO,
            mensajeError: null,
            fechaProcesamiento: new Date(),
            contenidoExtraido: contenidoNormalizado,
            vectorDocumentoId: vectorOk ? documento.id : null,
            coleccionVectorial: vectorOk ? CHROMA_DOCUMENT_COLLECTION : null,
        },
    });

    return actualizado;
}

router.get(
    '/etiquetas',
    authenticate,
    authorize(['DOCUMENTADOR']),
    async (req, res) => {
        const etiquetas = ETIQUETAS_DISPONIBLES.map((valor) => ({
            id: valor,
            label: ETIQUETA_LABELS[valor] || valor,
        }));

        return res.json({ etiquetas });
    },
);

router.get(
    '/',
    authenticate,
    authorize(['DOCUMENTADOR']),
    async (req, res) => {
        try {
            const documentos = await prisma.documento.findMany({
                orderBy: {
                    fechaCreacion: 'desc',
                },
            });

            return res.json({ documentos: documentos.map(sanitizeDocument) });
        } catch (error) {
            return res.status(500).json({
                error: 'Error listando documentos',
                message: error.message,
            });
        }
    },
);

router.post(
    '/',
    authenticate,
    authorize(['DOCUMENTADOR']),
    upload.single('archivo'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                error: 'Archivo requerido',
                message: 'Debes adjuntar un archivo PDF',
            });
        }

        const etiquetas = parseEtiquetas(req.body.etiquetas);
        if (etiquetas.length === 0) {
            return res.status(400).json({
                error: 'Etiquetas requeridas',
                message: 'Debes seleccionar al menos una etiqueta valida',
            });
        }

        const tituloOriginal = typeof req.body.titulo === 'string' ? req.body.titulo.trim() : '';
        const tituloDocumento = tituloOriginal || path.basename(req.file.originalname, path.extname(req.file.originalname));

        try {
            const documento = await prisma.documento.create({
                data: {
                    usuarioId: req.user.id,
                    titulo: tituloDocumento,
                    nombreOriginal: req.file.originalname,
                    rutaArchivo: path.resolve(req.file.path),
                    tamanoBytes: req.file.size,
                    tipoMime: req.file.mimetype,
                    estadoProcesamiento: EstadoProcesamiento.PROCESANDO,
                    etiquetas,
                },
            });

            try {
                const actualizado = await procesarDocumento({
                    documento,
                    titulo: tituloDocumento,
                    etiquetas,
                    filePath: req.file.path,
                });

                return res.status(201).json({
                    documento: sanitizeDocument(actualizado),
                });
            } catch (processingError) {
                const mensaje = processingError instanceof Error ? processingError.message : 'Error procesando el documento';

                await prisma.documento.update({
                    where: { id: documento.id },
                    data: {
                        estadoProcesamiento: EstadoProcesamiento.ERROR,
                        mensajeError: mensaje,
                        fechaProcesamiento: new Date(),
                    },
                });

                return res.status(500).json({
                    error: 'Error procesando documento',
                    message: mensaje,
                });
            }
        } catch (error) {
            return res.status(500).json({
                error: 'Error creando registro de documento',
                message: error.message,
            });
        }
    },
);

export default router;
