import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import prismaPackage from '@prisma/client';
import chromaService from '../src/services/chromaService.js';
import { procesarDocumento } from '../src/routes/documentos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { PrismaClient } = prismaPackage;
const prisma = new PrismaClient();

function parseEtiquetas(etiquetas) {
    if (Array.isArray(etiquetas)) {
        return etiquetas.map((value) => String(value).trim()).filter(Boolean);
    }

    if (typeof etiquetas === 'string') {
        try {
            const parsed = JSON.parse(etiquetas);
            if (Array.isArray(parsed)) {
                return parsed.map((value) => String(value).trim()).filter(Boolean);
            }
        } catch (error) {
            return etiquetas.split(',').map((value) => value.trim()).filter(Boolean);
        }
    }

    return [];
}

async function main() {
    await chromaService.initialize();

    const pendientes = await prisma.documento.findMany({
        where: { estadoProcesamiento: 'PROCESANDO' },
        orderBy: { fechaCreacion: 'asc' },
    });

    if (pendientes.length === 0) {
        console.log('✅ No hay documentos pendientes de reprocesar');
        return;
    }

    console.log(`🔁 Reprocesando ${pendientes.length} documento(s) pendientes...`);

    for (const documento of pendientes) {
        console.log(`→ Documento ${documento.id} (${documento.titulo})`);

        try {
            await fs.access(documento.rutaArchivo);
        } catch (error) {
            const mensaje = 'Archivo no encontrado en el almacenamiento';
            console.warn(`   ⚠️ ${mensaje}: ${documento.rutaArchivo}`);
            await prisma.documento.update({
                where: { id: documento.id },
                data: {
                    estadoProcesamiento: 'ERROR',
                    mensajeError: mensaje,
                    fechaProcesamiento: new Date(),
                },
            });
            continue;
        }

        const etiquetas = parseEtiquetas(documento.etiquetas);
        const titulo = documento.titulo || documento.nombreOriginal;

        try {
            await procesarDocumento({
                documento,
                titulo,
                etiquetas,
                filePath: documento.rutaArchivo,
            });
            console.log('   ✅ Reprocesado correctamente');
        } catch (error) {
            const mensaje = error instanceof Error ? error.message : 'Error reprocesando el documento';
            console.error(`   ❌ ${mensaje}`);
            await prisma.documento.update({
                where: { id: documento.id },
                data: {
                    estadoProcesamiento: 'ERROR',
                    mensajeError: mensaje,
                    fechaProcesamiento: new Date(),
                },
            });
        }
    }
}

main()
    .catch((error) => {
        console.error('❌ Error general reprocesando documentos:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
