// Servicio para ChromaDB - Base de datos vectorial
// Manejo de documentación y búsqueda semántica para IA
import { ChromaClient } from 'chromadb';

class ChromaService {
    constructor() {
        this.client = null;
        this.collection = null;
        this.isAvailable = false;
        this.collectionName = process.env.CHROMA_COLLECTION || 'rpjia-actividades';
    }

    async initialize() {
        const host = process.env.CHROMA_HOST || '127.0.0.1';
        const port = Number(process.env.CHROMA_PORT || '8000');
        const ssl = process.env.CHROMA_SSL === 'true';

        let clientOptions = { host, port, ssl };

        if (process.env.CHROMA_URL) {
            try {
                const parsed = new URL(process.env.CHROMA_URL);

                clientOptions = {
                    host: parsed.hostname,
                    port: Number(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80),
                    ssl: parsed.protocol === 'https:',
                };
            } catch (error) {
                console.warn('⚠️ No se pudo interpretar CHROMA_URL, se usará host/port por defecto');
            }
        }

        try {
            this.client = new ChromaClient(clientOptions);

            this.collection = await this.client.getOrCreateCollection({
                name: this.collectionName,
                metadata: {
                    project: 'asistente-ia-juvenil',
                    created_at: new Date().toISOString(),
                },
            });

            // Verificar el estado conectando con una consulta mínima
            await this.collection.count();

            this.isAvailable = true;
            console.log(`📚 ChromaDB conectado en ${baseUrl} (colección: ${this.collectionName})`);
            return true;
        } catch (error) {
            console.error('❌ Error inicializando ChromaDB:', error.message);
            this.client = null;
            this.collection = null;
            this.isAvailable = false;
            return false;
        }
    }

    async addDocument(id, content, metadata = {}) {
        if (!this.isAvailable || !this.collection) {
            console.log('⚠️ ChromaDB no disponible, omitiendo documento');
            return false;
        }

        try {
            await this.collection.add({
                ids: [id],
                documents: [content],
                metadatas: [metadata],
            });

            return true;
        } catch (error) {
            console.error('❌ Error añadiendo documento a ChromaDB:', error.message);
            return false;
        }
    }

    async searchSimilar(query, limit = 5) {
        if (!this.isAvailable || !this.collection) {
            console.log('⚠️ ChromaDB no disponible, devolviendo resultados vacíos');
            return [];
        }

        try {
            const result = await this.collection.query({
                queryTexts: [query],
                nResults: limit,
                include: ['documents', 'metadatas', 'distances'],
            });

            if (!result || !result.ids || result.ids.length === 0) {
                return [];
            }

            const firstBatch = result.ids[0] || [];

            return firstBatch.map((id, index) => ({
                id,
                document: result.documents?.[0]?.[index] || '',
                metadata: result.metadatas?.[0]?.[index] || {},
                distance: result.distances?.[0]?.[index] || null,
            }));
        } catch (error) {
            console.error('❌ Error buscando en ChromaDB:', error.message);
            return [];
        }
    }

    async getDocumentCount() {
        if (!this.isAvailable || !this.collection) return -1;

        try {
            return await this.collection.count();
        } catch (error) {
            console.error('❌ Error obteniendo conteo de ChromaDB:', error.message);
            return -1;
        }
    }
}

// Instancia singleton
const chromaService = new ChromaService();

export default chromaService;