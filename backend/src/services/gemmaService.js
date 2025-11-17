// Servicio para interactuar con Gemma 3 4b It - Asistente de aplicación
import dotenv from 'dotenv';

dotenv.config();

const CHUTES_API_TOKEN = process.env.CHUTES_API_TOKEN;
const GEMMA_MODEL = 'unsloth/gemma-3-4b-it';
const API_URL = 'https://llm.chutes.ai/v1/chat/completions';

/**
 * Llama a Gemma 3 4b It para tareas de asistencia de aplicación
 * @param {Array} messages - Array de mensajes en formato OpenAI
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<string>} - Respuesta del modelo
 */
async function callGemma(messages, options = {}) {
    const {
        temperature = 0.7,
        maxTokens = 1024,
        stream = false,
    } = options;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHUTES_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: GEMMA_MODEL,
                messages,
                stream,
                max_tokens: maxTokens,
                temperature,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Gemma API error (${response.status}): ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Respuesta inválida de Gemma API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        console.error('❌ Error en Gemma Service:', error.message);
        throw error;
    }
}

/**
 * Genera un título resumido para un chat basado en el primer mensaje
 * @param {string} firstMessage - Primer mensaje del usuario
 * @returns {Promise<string>} - Título del chat (máximo 50 caracteres)
 */
export async function generateChatTitle(firstMessage) {
    const prompt = `Genera un título muy corto y descriptivo (máximo 5 palabras) para un chat que empieza con este mensaje del usuario:

"${firstMessage}"

Responde SOLO con el título, sin comillas, sin explicaciones. Debe ser claro y reflejar el tema principal.`;

    try {
        const title = await callGemma([
            { role: 'user', content: prompt }
        ], {
            temperature: 0.5,
            maxTokens: 50,
        });

        // Limpiar el título (quitar comillas, saltos de línea, etc.)
        const cleanTitle = title.trim().replace(/^["']|["']$/g, '').slice(0, 60);
        return cleanTitle || 'Nueva conversación';
    } catch (error) {
        console.error('Error generando título de chat:', error);
        return 'Nueva conversación';
    }
}

/**
 * Genera un saludo inicial personalizado con el nombre del usuario
 * @param {string} userName - Nombre del usuario
 * @param {string} intent - Intención del chat (DINAMICA, ORACION, etc.)
 * @returns {Promise<string>} - Mensaje de saludo
 */
export async function generateInitialGreeting(userName, intent = null) {
    const intentContext = intent ? `El usuario está interesado en: ${intent}.` : '';
    
    const prompt = `Genera un saludo corto, cálido y juvenil para ${userName} que acaba de abrir un nuevo chat en una aplicación de pastoral juvenil. ${intentContext}

El saludo debe:
- Ser breve (máximo 2 líneas)
- Ser acogedor y motivador
- Invitar a compartir lo que necesita
- NO usar emojis

Responde SOLO con el saludo, sin comillas.`;

    try {
        const greeting = await callGemma([
            { role: 'user', content: prompt }
        ], {
            temperature: 0.8,
            maxTokens: 150,
        });

        return greeting.trim();
    } catch (error) {
        console.error('Error generando saludo inicial:', error);
        return `¡Hola ${userName}! 👋 ¿En qué puedo ayudarte hoy?`;
    }
}

/**
 * Transcribe y analiza el contenido de un archivo (imagen o PDF)
 * @param {string} fileContent - Contenido del archivo (texto extraído, OCR, etc.)
 * @param {string} fileName - Nombre del archivo
 * @param {string} fileType - Tipo de archivo (image/jpeg, application/pdf, etc.)
 * @returns {Promise<Object>} - Objeto con texto transcrito y resumen
 */
export async function transcribeFileContent(fileContent, fileName, fileType) {
    const prompt = `Analiza el siguiente contenido extraído del archivo "${fileName}" (tipo: ${fileType}).

CONTENIDO:
${fileContent}

Tu tarea es:
1. Transcribir y organizar el contenido de forma clara
2. Identificar los puntos clave
3. Preparar un resumen estructurado que será útil como contexto para un asistente de IA

Responde en formato JSON con esta estructura:
{
  "transcripcion": "Texto completo transcrito y organizado",
  "resumen": "Resumen breve de los puntos principales",
  "palabrasClave": ["palabra1", "palabra2", "..."]
}`;

    try {
        const response = await callGemma([
            { role: 'user', content: prompt }
        ], {
            temperature: 0.3,
            maxTokens: 2048,
        });

        // Intentar parsear la respuesta como JSON
        try {
            // Buscar el JSON en la respuesta (puede estar envuelto en markdown)
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    transcripcion: parsed.transcripcion || fileContent,
                    resumen: parsed.resumen || '',
                    palabrasClave: parsed.palabrasClave || [],
                };
            }
        } catch (parseError) {
            console.warn('No se pudo parsear respuesta JSON de Gemma, usando contenido original');
        }

        // Si no se puede parsear, devolver el contenido original
        return {
            transcripcion: fileContent,
            resumen: response.slice(0, 500),
            palabrasClave: [],
        };
    } catch (error) {
        console.error('Error transcribiendo contenido con Gemma:', error);
        return {
            transcripcion: fileContent,
            resumen: '',
            palabrasClave: [],
        };
    }
}

/**
 * Optimiza texto para almacenamiento en ChromaDB
 * @param {string} text - Texto a optimizar
 * @param {number} maxLength - Longitud máxima del texto
 * @returns {Promise<string>} - Texto optimizado
 */
export async function optimizeTextForEmbedding(text, maxLength = 4000) {
    if (text.length <= maxLength) {
        return text;
    }

    const prompt = `Resume el siguiente texto preservando toda la información importante. El resumen debe ser claro y completo, con un máximo de ${maxLength} caracteres:

${text}

Responde SOLO con el resumen, sin introducción ni explicaciones.`;

    try {
        const optimized = await callGemma([
            { role: 'user', content: prompt }
        ], {
            temperature: 0.3,
            maxTokens: Math.floor(maxLength / 2),
        });

        return optimized.trim();
    } catch (error) {
        console.error('Error optimizando texto:', error);
        // Si falla, truncar directamente
        return text.slice(0, maxLength) + '...';
    }
}

export default {
    generateChatTitle,
    generateInitialGreeting,
    transcribeFileContent,
    optimizeTextForEmbedding,
};
