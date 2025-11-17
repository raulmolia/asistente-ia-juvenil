// Test de búsqueda en fuentes web
import chromaService from './src/services/chromaService.js';

async function test() {
    await chromaService.initialize();
    
    console.log('\n🔍 Búsqueda: "escolapios"\n');
    const results = await chromaService.searchSimilar('escolapios', 3, 'rpjia-fuentes-web');
    
    console.log(`Resultados encontrados: ${results.length}\n`);
    
    results.forEach((r, i) => {
        console.log(`[${i+1}] ${r.metadata.pagina_titulo || r.metadata.titulo}`);
        console.log(`URL: ${r.metadata.pagina_url || r.metadata.url}`);
        console.log(`Texto: ${r.document.substring(0, 150)}...`);
        console.log(`Distance: ${r.distance}\n`);
    });
}

test();
