import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function diagnosticConnection() {
    console.log('🔍 Diagnóstico de conexión PostgreSQL');
    console.log('=====================================');

    const configurations = [
        {
            name: 'Configuración Original',
            config: {
                host: 'localhost',
                port: 5432,
                database: 'RPJIA',
                user: 'sa',
                password: 'Servidor2025'
            }
        },
        {
            name: 'Con IP 127.0.0.1',
            config: {
                host: '127.0.0.1',
                port: 5432,
                database: 'RPJIA',
                user: 'sa',
                password: 'Servidor2025'
            }
        },
        {
            name: 'Sin especificar base de datos',
            config: {
                host: 'localhost',
                port: 5432,
                database: 'postgres',
                user: 'sa',
                password: 'Servidor2025'
            }
        },
        {
            name: 'Con usuario adminweb',
            config: {
                host: 'localhost',
                port: 5432,
                database: 'RPJIA',
                user: 'adminweb',
                password: 'Servidor2025'
            }
        }
    ];

    for (const { name, config } of configurations) {
        console.log(`\n🧪 Probando: ${name}`);
        console.log(`   Host: ${config.host}, DB: ${config.database}, User: ${config.user}`);

        const client = new Client(config);

        try {
            await client.connect();
            console.log('✅ Conexión exitosa');

            const result = await client.query('SELECT version()');
            console.log(`📊 PostgreSQL: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);

            const databases = await client.query(`
        SELECT datname FROM pg_database 
        WHERE datname NOT IN ('template0', 'template1') 
        ORDER BY datname
      `);
            console.log(`🗃️ Bases de datos: ${databases.rows.map(r => r.datname).join(', ')}`);

            await client.end();
            break; // Si una configuración funciona, usar esa

        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            try {
                await client.end();
            } catch (e) {
                // Ignorar errores al cerrar
            }
        }
    }
}

diagnosticConnection();