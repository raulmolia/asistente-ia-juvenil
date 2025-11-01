import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
    try {
        console.log('🔄 Probando conexión con la base de datos...');
        console.log('URL de conexión:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

        // Probar conexión básica
        await prisma.$connect();
        console.log('✅ Conexión establecida exitosamente');

        // Probar query básica
        const result = await prisma.$queryRaw`SELECT version() as version, now() as tiempo`;
        console.log('📊 Información de la base de datos:', result);

        // Verificar si existen tablas
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
        console.log('📋 Tablas existentes:', tables);

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.error('🔍 Detalles del error:', error);
    } finally {
        await prisma.$disconnect();
        console.log('🔌 Conexión cerrada');
    }
}

testConnection();