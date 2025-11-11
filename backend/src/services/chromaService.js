// Servicio para ChromaDB - Base de datos vectorial
// Manejo de documentación y búsqueda semántica para IA
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

class ChromaService {
    constructor() {
        this.client = null;
        this.collection = null;
        this.collections = new Map();
        this.isAvailable = false;
        this.collectionName = process.env.CHROMA_COLLECTION || 'rpjia-actividades';
        this.baseUrl = null;
        this.initializing = null;
        this.retryHandle = null;
        this.retryDelayMs = Math.max(
            Number.parseInt(process.env.CHROMA_RETRY_DELAY_MS || '5000', 10),
            1000,
        );

        this.embeddingFunction = null;

        try {
            this.embeddingFunction = new DefaultEmbeddingFunction();
        } catch (error) {
            console.error('⚠️ No se pudo cargar DefaultEmbeddingFunction de Chroma:', error.message);
        }

        const parsedBatchSize = Number.parseInt(process.env.CHROMA_EMBED_BATCH_SIZE || '8', 10);
        this.embeddingBatchSize = Number.isFinite(parsedBatchSize) && parsedBatchSize > 0
            ? parsedBatchSize
            : 16;
    }

    normalizeMetadata(rawMetadata) {
        if (!rawMetadata || typeof rawMetadata !== 'object') {
            return {};
        }

        const normalized = {};

        for (const [key, value] of Object.entries(rawMetadata)) {
            if (value === undefined) {
                normalized[key] = null;
            } else if (value === null) {
                normalized[key] = null;
            } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                normalized[key] = value;
            } else if (value instanceof Date) {
                normalized[key] = value.toISOString();
            } else if (Array.isArray(value)) {
                normalized[key] = JSON.stringify(value);
            } else {
                try {
                    normalized[key] = JSON.stringify(value);
                } catch (error) {
                    normalized[key] = String(value);
                }
            }
        }

        return normalized;
    }

    buildClientOptions() {
        const host = process.env.CHROMA_HOST || '127.0.0.1';
        const port = Number(process.env.CHROMA_PORT || '8000');
        const ssl = process.env.CHROMA_SSL === 'true';

        if (process.env.CHROMA_URL) {
            try {
                const parsed = new URL(process.env.CHROMA_URL);
                return {
                    host: parsed.hostname,
                    port: Number(parsed.port) || (parsed.protocol === 'https:' ? 443 : 80),
                    ssl: parsed.protocol === 'https:',
                };
            } catch (error) {
                console.warn('⚠️ No se pudo interpretar CHROMA_URL, se usará host/port por defecto');
            }
        }

        return { host, port, ssl };
    }

    scheduleRetry() {
        if (this.retryHandle) {
            return;
        }

        this.retryHandle = setTimeout(() => {
            this.retryHandle = null;
            this.initialize().catch(() => {
                /* la re-intentaremos en la siguiente invocación */
            });
        }, this.retryDelayMs);

        if (typeof this.retryHandle.unref === 'function') {
            this.retryHandle.unref();
        }
    }

    async initialize(force = false) {
        if (this.isAvailable && !force) {
            return true;
        }

        if (this.initializing && !force) {
            return this.initializing;
        }

        const initPromise = (async () => {
            const clientOptions = this.buildClientOptions();

            try {
                this.client = new ChromaClient(clientOptions);
                this.baseUrl = `${clientOptions.ssl ? 'https' : 'http'}://${clientOptions.host}:${clientOptions.port}`;

                const collection = await this.client.getOrCreateCollection({
                    name: this.collectionName,
                    metadata: {
                        project: 'asistente-ia-juvenil',
                        created_at: new Date().toISOString(),
                    },
                    embeddingFunction: null,
                });

                this.collections.set(this.collectionName, collection);
                this.collection = collection;

                await collection.count();

                if (this.retryHandle) {
                    clearTimeout(this.retryHandle);
                    this.retryHandle = null;
                }

                this.isAvailable = true;
                console.log(`📚 ChromaDB conectado en ${this.baseUrl} (colección base: ${this.collectionName})`);
                return true;
            } catch (error) {
                console.error('❌ Error inicializando ChromaDB:', error.message);
                this.client = null;
                this.collection = null;
                this.collections.clear();
                this.isAvailable = false;
                this.scheduleRetry();
                return false;
            } finally {
                this.initializing = null;
            }
        })();

        this.initializing = initPromise;
        return initPromise;
    }

    async ensureReady() {
        if (this.isAvailable && this.client) {
            return true;
        }

        const initialized = await this.initialize();
        return initialized;
    }

    async getOrCreateCollection(name) {
        if (!this.client) {
            const ready = await this.ensureReady();
            if (!ready) {
                throw new Error('ChromaDB no inicializado');
            }
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
            // Usamos embeddings locales, por lo que evitamos configurar uno remoto.
            embeddingFunction: null,
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
            const ready = await this.ensureReady();

            if (!ready) {
                console.log('⚠️ ChromaDB no disponible, omitiendo documentos');
                return false;
            }
        }

        if (!this.embeddingFunction) {
            console.log('⚠️ No hay función de embeddings configurada, imposible procesar documentos');
            return false;
        }

        if (!Array.isArray(entries) || entries.length === 0) {
            return false;
        }

        try {
            const targetCollection = await this.getOrCreateCollection(collectionName || this.collectionName);

            const batchSize = Math.max(Number.isFinite(this.embeddingBatchSize)
                ? this.embeddingBatchSize
                : 8, 1);

            for (let index = 0; index < entries.length; index += batchSize) {
                const batchEntries = entries.slice(index, index + batchSize);
                const documents = batchEntries.map((entry) => entry.document || '');
                const embeddings = await this.embeddingFunction.generate(documents);

                await targetCollection.add({
                    ids: batchEntries.map((entry) => entry.id),
                    documents,
                    embeddings,
                    metadatas: batchEntries.map((entry) => this.normalizeMetadata(entry.metadata)),
                });
            }

            return true;
        } catch (error) {
            console.error('❌ Error añadiendo documentos a ChromaDB:', error.message);
            return false;
        }
    }

    async searchSimilar(query, limit = 5, collectionName = null) {
        if (!this.isAvailable || !this.client) {
            const ready = await this.ensureReady();

            if (!ready) {
                console.log('⚠️ ChromaDB no disponible, devolviendo resultados vacíos');
                return [];
            }
        }

        if (!this.embeddingFunction) {
            console.log('⚠️ No hay función de embeddings configurada para búsquedas');
            return [];
        }

        try {
            const targetCollection = await this.getOrCreateCollection(collectionName || this.collectionName);

            const [queryEmbedding] = await this.embeddingFunction.generate([query]);

            const result = await targetCollection.query({
                queryEmbeddings: [queryEmbedding],
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
        if (!this.isAvailable || !this.client) {
            const ready = await this.ensureReady();
            if (!ready) {
                return -1;
            }
        }

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