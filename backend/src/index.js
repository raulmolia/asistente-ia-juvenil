import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https:"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana de tiempo
    message: {
        error: 'Demasiadas solicitudes desde esta IP, inténtalo de nuevo más tarde.',
    },
});
app.use('/api/', limiter);

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rutas básicas
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API del Asistente IA Juvenil funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        name: 'Asistente IA para Actividades Juveniles',
        description: 'Backend API para la generación de actividades juveniles con IA',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            users: '/api/users/*',
            activities: '/api/activities/*',
            ai: '/api/ai/*',
        },
    });
});

// Ruta 404 para rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe en esta API`,
        availableEndpoints: ['/api/health', '/api/info'],
    });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error:', error);

    res.status(error.status || 500).json({
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Ha ocurrido un error',
        timestamp: new Date().toISOString(),
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend iniciado en puerto ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 Info API: http://localhost:${PORT}/api/info`);
    console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

export default app;