// Script para reprocesar fuentes web pendientes
import { PrismaClient } from '@prisma/client';
import chromaService from './src/services/chromaService.js';
import webScraperService from './src/services/webScraperService.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const WEB_CHUNK_SIZE = Number(process.env.WEB_CHUNK_SIZE) || 1500;
const WEB_CHUNK_OVERLAP = Number(process.env.WEB_CHUNK_OVERLAP) || 200;
const WEB_MAX_CHUNKS = Number(process.env.WEB_MAX_CHUNKS) || 200;
const CHROMA_WEB_COLLECTION = 'rpjia-fuentes-web';

const TipoFuenteWeb = {
    PAGINA: 'PAGINA',
    DOMINIO: 'DOMINIO',
    SITEMAP: 'SITEMAP',
};

const EstadoProcesamiento = {
    PENDIENTE: 'PENDIENTE',
    PROCESANDO: 'PROCESANDO',
    COMPLETADO: 'COMPLETADO',
    ERROR: 'ERROR',
};

function splitIntoChunks(text, maxSize, overlap) {
    if (!text || text.length === 0) {
        return [];
    }

    const chunks = [];
    const safeMaxSize = Math.max(maxSize, 100);
    const safeOverlap = Math.min(overlap, Math.floor(safeMaxSize / 2));
    const length = text.length;
    let start = 0;

    while (start < length) {
        let end = start + safeMaxSize;
        if (end >= length) {
            end = length;
        }

        const fragment = text.substring(start, end);
        if (fragment.trim().length > 0) {
            chunks.push(fragment);
        }

        if (end >= length) break;

        start = end - safeOverlap;
        if (start < 0) start = 0;
    }

    return chunks;
}

function convertToChromaEntries(chunks, metadatas, ids) {
    return chunks.map((chunk, index) => ({
        id: ids[index],
        document: chunk,
        metadata: metadatas[index],
    }));
}

async function procesarFuente(fuenteWeb) {
    const etiquetas = Array.isArray(fuenteWeb.etiquetas) ? fuenteWeb.etiquetas : [];
    
    const metadataBase = {
        tipo: 'fuente_web',
        etiquetas: etiquetas.join(',') || null,
        etiquetas_json: JSON.stringify(etiquetas),
        url: fuenteWeb.url,
        dominio: fuenteWeb.dominio,
        titulo: fuenteWeb.titulo || '',
        fechaRegistro: new Date().toISOString(),
        fuenteWebId: fuenteWeb.id,
    };

    try {
        await prisma.fuenteWeb.update({
            where: { id: fuenteWeb.id },
            data: { estadoProcesamiento: EstadoProcesamiento.PROCESANDO },
        });

        console.log(`\n📝 Procesando: ${fuenteWeb.url} (${fuenteWeb.tipoFuente})`);

        let scrapeResult;

        if (fuenteWeb.tipoFuente === TipoFuenteWeb.PAGINA) {
            scrapeResult = await webScraperService.scrapePage(fuenteWeb.url);
            
            if (!scrapeResult.success) {
                throw new Error(scrapeResult.error || 'Error desconocido al scrapear la página');
            }

            const chunks = splitIntoChunks(scrapeResult.content, WEB_CHUNK_SIZE, WEB_CHUNK_OVERLAP);
            const limitedChunks = chunks.slice(0, WEB_MAX_CHUNKS);

            const metadata = {
                ...metadataBase,
                descripcion: scrapeResult.description || '',
                wordCount: scrapeResult.wordCount,
            };

            const entries = convertToChromaEntries(
                limitedChunks,
                Array(limitedChunks.length).fill(metadata),
                limitedChunks.map((_, index) => `${fuenteWeb.id}_chunk_${index}`)
            );

            const addResult = await chromaService.addDocuments(entries, CHROMA_WEB_COLLECTION);

            if (!addResult) {
                throw new Error('Error vectorizando contenido');
            }

            console.log(`✅ Vectorizados ${limitedChunks.length} chunks`);

            await prisma.fuenteWeb.update({
                where: { id: fuenteWeb.id },
                data: {
                    titulo: scrapeResult.title || fuenteWeb.titulo,
                    descripcion: scrapeResult.description || fuenteWeb.descripcion,
                    contenidoExtraido: scrapeResult.content.slice(0, 50000),
                    estadoProcesamiento: EstadoProcesamiento.COMPLETADO,
                    fechaProcesamiento: new Date(),
                    vectorDocumentoId: fuenteWeb.id,
                    coleccionVectorial: CHROMA_WEB_COLLECTION,
                },
            });

        } else if (fuenteWeb.tipoFuente === TipoFuenteWeb.DOMINIO) {
            scrapeResult = await webScraperService.scrapeDomain(fuenteWeb.url);

            const successfulPages = scrapeResult.pages.filter(p => p.success);
            let totalChunks = 0;

            for (const page of successfulPages) {
                const chunks = splitIntoChunks(page.content, WEB_CHUNK_SIZE, WEB_CHUNK_OVERLAP);
                const limitedChunks = chunks.slice(0, Math.floor(WEB_MAX_CHUNKS / successfulPages.length));

                const pageMetadata = {
                    ...metadataBase,
                    pagina_url: page.url,
                    pagina_titulo: page.title,
                    pagina_descripcion: page.description,
                };

                const entries = convertToChromaEntries(
                    limitedChunks,
                    Array(limitedChunks.length).fill(pageMetadata),
                    limitedChunks.map((_, index) => `${fuenteWeb.id}_${totalChunks + index}`)
                );

                const addResult = await chromaService.addDocuments(entries, CHROMA_WEB_COLLECTION);

                if (!addResult) {
                    console.error(`❌ Error vectorizando página ${page.url}`);
                } else {
                    console.log(`✅ Vectorizados ${limitedChunks.length} chunks de ${page.url}`);
                }

                totalChunks += limitedChunks.length;
            }

            const combinedContent = successfulPages
                .map(p => `${p.title}\n${p.content}`)
                .join('\n\n')
                .slice(0, 50000);

            await prisma.fuenteWeb.update({
                where: { id: fuenteWeb.id },
                data: {
                    titulo: `Dominio: ${scrapeResult.domain}`,
                    descripcion: `${scrapeResult.successfulPages} páginas procesadas`,
                    contenidoExtraido: combinedContent,
                    estadoProcesamiento: EstadoProcesamiento.COMPLETADO,
                    fechaProcesamiento: new Date(),
                    vectorDocumentoId: fuenteWeb.id,
                    coleccionVectorial: CHROMA_WEB_COLLECTION,
                },
            });

            console.log(`✅ Total: ${totalChunks} chunks de ${successfulPages.length} páginas`);
        }

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        await prisma.fuenteWeb.update({
            where: { id: fuenteWeb.id },
            data: {
                estadoProcesamiento: EstadoProcesamiento.ERROR,
                mensajeError: error.message,
            },
        });
    }
}

async function main() {
    console.log('🚀 Reprocesando fuentes web pendientes...\n');

    try {
        await chromaService.initialize();
        console.log('✅ ChromaDB inicializado\n');

        const fuentesPendientes = await prisma.fuenteWeb.findMany({
            where: { estadoProcesamiento: EstadoProcesamiento.PENDIENTE },
        });

        console.log(`📊 ${fuentesPendientes.length} fuentes pendientes\n`);

        for (const fuente of fuentesPendientes) {
            await procesarFuente(fuente);
        }

        console.log('\n✅ Reprocesamiento completado');

        const count = await chromaService.getDocumentCount(CHROMA_WEB_COLLECTION);
        console.log(`📚 Total documentos en ${CHROMA_WEB_COLLECTION}: ${count}`);

    } catch (error) {
        console.error('❌ Error en reprocesamiento:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();
