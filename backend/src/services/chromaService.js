// Servicio para ChromaDB - Base de datos vectorial
// Manejo de documentación y búsqueda semántica para IA
import { ChromaClient } from 'chromadb';

class ChromaService {
    constructor() {
        this.client = null;
        this.collection = null;
        this.collections = new Map();
        this.isAvailable = false;
        this.collectionName = process.env.CHROMA_COLLECTION || 'rpjia-actividades';
        this.baseUrl = null;
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
            this.baseUrl = `${clientOptions.ssl ? 'https' : 'http'}://${clientOptions.host}:${clientOptions.port}`;

            this.collection = await this.getOrCreateCollection(this.collectionName);

            // Verificar el estado conectando con una consulta mínima
            await this.collection.count();

            this.isAvailable = true;
            console.log(`📚 ChromaDB conectado en ${this.baseUrl} (colección base: ${this.collectionName})`);
            return true;
        } catch (error) {
            console.error('❌ Error inicializando ChromaDB:', error.message);
            this.client = null;
            this.collection = null;
            this.collections.clear();
            this.isAvailable = false;
            return false;
        }
    }

    async getOrCreateCollection(name) {
        if (!this.isAvailable && !this.client) {
            throw new Error('ChromaDB no inicializado');
        }

        const targetName = name || this.collectionName;

        if (this.collections.has(targetName)) {
            return this.collections.get(targetName);
        }

        const collection = await this.client.getOrCreateCollection({
            name: targetName,
            metadata: {
                project: 'asistente-ia-juvenil',
                created_at: new Date().toISOString(),
            },
        });

        this.collections.set(targetName, collection);
        return collection;
    }

    async addDocument(id, content, metadata = {}, collectionName = null) {
        return this.addDocuments([
            {
                id,
                document: content,
                metadata,
            },
        ], collectionName);
    }

    async addDocuments(entries, collectionName = null) {
        if (!this.isAvailable || !this.client) {
            console.log('⚠️ ChromaDB no disponible, omitiendo documentos');
            return false;
        }

        if (!Array.isArray(entries) || entries.length === 0) {
            return false;
        }

        try {
            const targetCollection = await this.getOrCreateCollection(collectionName || this.collectionName);

            await targetCollection.add({
                ids: entries.map((entry) => entry.id),
                documents: entries.map((entry) => entry.document || ''),
                metadatas: entries.map((entry) => entry.metadata || {}),
            });

            return true;
        } catch (error) {
            console.error('❌ Error añadiendo documentos a ChromaDB:', error.message);
            return false;
        }
    }

    async searchSimilar(query, limit = 5, collectionName = null) {
        if (!this.isAvailable || !this.client) {
            console.log('⚠️ ChromaDB no disponible, devolviendo resultados vacíos');
            return [];
        }

        try {
            const targetCollection = await this.getOrCreateCollection(collectionName || this.collectionName);

            const result = await targetCollection.query({
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

    async getDocumentCount(collectionName = null) {
        if (!this.isAvailable || !this.client) return -1;

        try {
            const targetCollection = await this.getOrCreateCollection(collectionName || this.collectionName);
            return await targetCollection.count();
        } catch (error) {
            console.error('❌ Error obteniendo conteo de ChromaDB:', error.message);
            return -1;
        }
    }
}

// Instancia singleton
const chromaService = new ChromaService();

export default chromaService;