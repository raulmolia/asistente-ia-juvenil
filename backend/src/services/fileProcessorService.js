// Servicio para procesar archivos adjuntos
// Extrae texto de diferentes formatos de archivo

import fs from 'fs/promises';
import path from 'path';

class FileProcessorService {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.supportedTypes = {
            'text/plain': this.extractTextFromTxt,
            'text/markdown': this.extractTextFromTxt,
            'application/json': this.extractTextFromJson,
            'text/csv': this.extractTextFromTxt,
            'text/html': this.extractTextFromHtml,
        };
    }

    async processFile(fileBuffer, fileName, mimeType) {
        try {
            // Validar tamaño
            if (fileBuffer.length > this.maxFileSize) {
                throw new Error(`El archivo excede el tamaño máximo permitido de ${this.maxFileSize / 1024 / 1024}MB`);
            }

            // Validar tipo de archivo
            const processor = this.supportedTypes[mimeType];
            if (!processor) {
                throw new Error(`Tipo de archivo no soportado: ${mimeType}. Formatos permitidos: TXT, MD, JSON, CSV, HTML`);
            }

            // Extraer texto
            const text = await processor.call(this, fileBuffer, fileName);

            return {
                success: true,
                fileName,
                mimeType,
                size: fileBuffer.length,
                text: text.trim(),
                wordCount: text.trim().split(/\s+/).length,
            };
        } catch (error) {
            return {
                success: false,
                fileName,
                error: error.message,
            };
        }
    }

    async extractTextFromTxt(buffer) {
        return buffer.toString('utf-8');
    }

    async extractTextFromJson(buffer) {
        try {
            const jsonData = JSON.parse(buffer.toString('utf-8'));
            return JSON.stringify(jsonData, null, 2);
        } catch (error) {
            throw new Error('Error parseando JSON: ' + error.message);
        }
    }

    async extractTextFromHtml(buffer) {
        const html = buffer.toString('utf-8');
        // Eliminación básica de tags HTML
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    getSupportedFormats() {
        return Object.keys(this.supportedTypes);
    }

    isFileSupported(mimeType) {
        return mimeType in this.supportedTypes;
    }
}

export default new FileProcessorService();
