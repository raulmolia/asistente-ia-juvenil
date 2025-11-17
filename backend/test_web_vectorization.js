// Test de vectorización de fuentes web
import chromaService from './src/services/chromaService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log('🧪 Iniciando test de vectorización...\n');

    try {
        // Inicializar ChromaDB
        console.log('1. Inicializando ChromaDB...');
        await chromaService.initialize();
        console.log('✅ ChromaDB inicializado\n');

        // Test básico: añadir un documento de prueba
        console.log('2. Probando addDocuments con datos de prueba...');
        const testResult = await chromaService.addDocuments(
            [
                {
                    id: 'test_id_001',
                    document: 'Este es un texto de prueba para vectorización',
                    metadata: { tipo: 'fuente_web', url: 'https://test.com', titulo: 'Test' }
                }
            ],
            'rpjia-fuentes-web'
        );

        if (testResult) {
            console.log('✅ addDocuments funcionó correctamente');
        } else {
            console.error('❌ addDocuments retornó false');
        }

        // Verificar si se añadió
        console.log('\n3. Verificando cuenta de documentos...');
        const count = await chromaService.getDocumentCount('rpjia-fuentes-web');
        console.log(`Documentos en colección: ${count}`);

        // Limpiar el documento de prueba
        console.log('\n4. Limpiando documento de prueba...');
        const collection = await chromaService.getOrCreateCollection('rpjia-fuentes-web');
        await collection.delete({ ids: ['test_id_001'] });
        console.log('✅ Documento de prueba eliminado');

        // Verificar estado final
        const finalCount = await chromaService.getDocumentCount('rpjia-fuentes-web');
        console.log(`\nCuenta final: ${finalCount} documentos`);

    } catch (error) {
        console.error('\n❌ Error en test:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

test();
