// Rutas para manejo de archivos adjuntos
import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import fileProcessorService from '../services/fileProcessorService.js';

const router = express.Router();

// Configurar multer para almacenar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5, // Máximo 5 archivos por petición
    },
    fileFilter: (req, file, cb) => {
        const supportedTypes = fileProcessorService.getSupportedFormats();
        if (supportedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`), false);
        }
    },
});

// POST /api/files/upload - Subir y procesar archivos
router.post('/upload', authenticate, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                error: 'No se proporcionaron archivos',
            });
        }

        const processedFiles = [];
        const errors = [];

        for (const file of req.files) {
            const result = await fileProcessorService.processFile(
                file.buffer,
                file.originalname,
                file.mimetype
            );

            if (result.success) {
                processedFiles.push({
                    fileName: result.fileName,
                    mimeType: result.mimeType,
                    size: result.size,
                    text: result.text,
                    wordCount: result.wordCount,
                });
            } else {
                errors.push({
                    fileName: result.fileName,
                    error: result.error,
                });
            }
        }

        return res.json({
            success: true,
            files: processedFiles,
            errors: errors.length > 0 ? errors : undefined,
            message: `${processedFiles.length} de ${req.files.length} archivos procesados correctamente`,
        });
    } catch (error) {
        console.error('❌ Error procesando archivos:', error);
        return res.status(500).json({
            error: 'Error procesando archivos',
            message: error.message,
        });
    }
});

// GET /api/files/supported-formats - Obtener formatos soportados
router.get('/supported-formats', authenticate, (req, res) => {
    const formats = fileProcessorService.getSupportedFormats();
    return res.json({
        formats,
        maxFileSize: '10MB',
        maxFiles: 5,
    });
});

export default router;
