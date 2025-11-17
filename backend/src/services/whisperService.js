/**
 * Servicio para transcripción de audio usando Whisper Large V3 via Chutes AI
 */

const CHUTES_API_TOKEN = process.env.CHUTES_API_TOKEN;
const WHISPER_API_URL = 'https://chutes-whisper-large-v3.chutes.ai/transcribe';

/**
 * Transcribe audio a texto usando Whisper Large V3
 * @param {Buffer} audioBuffer - Buffer del audio a transcribir
 * @returns {Promise<{text: string}>} - Texto transcrito
 */
export async function transcribeAudio(audioBuffer) {
    try {
        // Convertir el buffer a base64
        const audioB64 = audioBuffer.toString('base64');

        const response = await fetch(WHISPER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CHUTES_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio_b64: audioB64,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error en Whisper API (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        // El API de Whisper normalmente devuelve { text: "..." }
        return {
            text: data.text || data.transcription || '',
        };
    } catch (error) {
        console.error('Error transcribiendo audio:', error);
        throw error;
    }
}

export default {
    transcribeAudio,
};
