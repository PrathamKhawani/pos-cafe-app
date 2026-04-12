const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');

async function fetchWikiImage(query) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'en.wikipedia.org',
            path: `/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=800&titles=${encodeURIComponent(query)}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) POS-bot/1.0'
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const pages = json.query.pages;
                    const firstPage = Object.values(pages)[0];
                    if (firstPage && firstPage.thumbnail && firstPage.thumbnail.source) {
                        resolve(firstPage.thumbnail.source);
                    } else {
                        // Fallback: search for page
                        let searchTerms = query.split(' (')[0]; // Remove things like (3pcs)
                        const searchPath = `/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerms + ' food')}&format=json`;
                        const searchOptions = { ...options, path: searchPath };
                        https.get(searchOptions, (res2) => {
                            let data2 = '';
                            res2.on('data', chunk => data2 += chunk);
                            res2.on('end', () => {
                                try {
                                    const json2 = JSON.parse(data2);
                                    if (json2.query && json2.query.search && json2.query.search.length > 0) {
                                        const title = json2.query.search[0].title;
                                        const path3 = `/w/api.php?action=query&prop=pageimages&format=json&pithumbsize=800&titles=${encodeURIComponent(title)}`;
                                        const options3 = { ...options, path: path3 };
                                        https.get(options3, (res3) => {
                                            let data3 = '';
                                            res3.on('data', chunk => data3 += chunk);
                                            res3.on('end', () => {
                                                try {
                                                    const json3 = JSON.parse(data3);
                                                    const page3 = Object.values(json3.query.pages)[0];
                                                    if (page3 && page3.thumbnail && page3.thumbnail.source) {
                                                        resolve(page3.thumbnail.source);
                                                    } else {
                                                        resolve(null);
                                                    }
                                                } catch (e) { resolve(null); }
                                            });
                                        }).on('error', () => resolve(null));
                                    } else {
                                        resolve(null);
                                    }
                                } catch (e) { resolve(null); }
                            });
                        }).on('error', () => resolve(null));
                    }
                } catch (e) {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const products = await prisma.product.findMany();
    let updatedCount = 0;
    const usedUrls = new Set();
    
    console.log(`Starting image updates for ${products.length} products...`);
    
    for (const product of products) {
        let imageUrl = await fetchWikiImage(product.name);
        await delay(500); // Politeness delay for Wikipedia API
        
        if (!imageUrl || usedUrls.has(imageUrl)) {
            // Unsplash Source (now random) or lorem flickr fallback. Let's use a nice foodish API logic
            // Actually, we can use https://loremflickr.com/800/600/food,<keyword>?lock=<id>
            // or just use generic images from unsplash and avoid repeating.
            let fallbackKeyword = product.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
            if (!fallbackKeyword) fallbackKeyword = 'food';
            
            let lockId = 1;
            do {
                imageUrl = `https://loremflickr.com/800/600/${fallbackKeyword},food?lock=${product.id + lockId}`;
                lockId++;
            } while (usedUrls.has(imageUrl) && lockId < 100);
            
            console.log(`Fallback for ${product.name}: ${imageUrl}`);
        } else {
            console.log(`Wikipedia for ${product.name}: ${imageUrl}`);
        }
        
        usedUrls.add(imageUrl);
        
        await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl }
        });
        
        updatedCount++;
    }
    
    console.log(`Finished! Successfully updated ${updatedCount} products with unique images.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
