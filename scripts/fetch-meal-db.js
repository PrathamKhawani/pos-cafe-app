const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');

async function fetchMealOrDrink(query) {
    const s = query.split(' (')[0].split(' ')[0]; // use first word for higher hit rate
    
    // exact meal search
    let mealUrl = await queryMealDB(query);
    if (mealUrl) return mealUrl;
    
    // partial meal search
    mealUrl = await queryMealDB(s);
    if (mealUrl) return mealUrl;
    
    // exact drink search
    let drinkUrl = await queryDrinkDB(query);
    if (drinkUrl) return drinkUrl;
    
    // partial drink search
    drinkUrl = await queryDrinkDB(s);
    if (drinkUrl) return drinkUrl;

    return null;
}

function queryMealDB(query) {
    return new Promise((resolve) => {
        https.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.meals && json.meals.length > 0) {
                        resolve(json.meals[0].strMealThumb + '/preview');
                    } else {
                        resolve(null);
                    }
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

function queryDrinkDB(query) {
    return new Promise((resolve) => {
        https.get(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.drinks && json.drinks.length > 0) {
                        resolve(json.drinks[0].strDrinkThumb + '/preview');
                    } else {
                        resolve(null);
                    }
                } catch(e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}

const placeholders = [
  "1504674900247-0877df9cc836", "1473093295043-cdd812d0e601", "1493770348161-369560ae357d", 
  "1482049360996-9f6082830f27", "1495474472205-1be7cb128bc3", "1497888329096-5ce89f98b236", 
  "1512152272829-4786bf626ced", "1540189549336-e6e99c3679fe", "1565299624946-b28f40a0ae38", 
  "1565958011703-44f9829ba187", "1484723091782-4def8b824db6", "1512621776951-a57e33716094", 
  "1543339308-c31326f60a44", "1564834724105-918b73d1b9e0", "1555939594-58d7cb561ad1", 
  "1511690656720-22e6b216ec7c", "1499028344343-cd173ffc68a9", "1565299585323-38c48085e423", 
  "1506084868230-bb9d95c24759", "1432139555190-58524dae6a55", "1476224209564-9fbb401e617d", 
  "1478145046317-39f10e470870", "1554679660-ddbf136515b6", "1455619452474-d023f034ee8b", 
  "1504544750208-dc0538d58a5e", "1481931098730-327c5ce52627", "1485962398555-d36c2f30b912", 
  "1547592180-d02bbd0dd0e5", "1565299507172-b88307dbab2d", "1447078310373-c3fa17de194b", 
  "1494859802808-5221976a444d", "1464454707361-b95cb7061d33", "1555939594-58d7cb561ad1",
  "1512058564259-2ff9e3ee4b6f", "1432139509613-5c4255815697", "1476224209564-9fbb401e617d"
];

async function main() {
    const products = await prisma.product.findMany();
    // Use consistent shuffle for placeholders
    const usedUrls = new Set();
    let pIdx = 0;
    
    console.log(`Working on ${products.length} products...`);
    
    for (const product of products) {
        // Skip if already has a high-quality DB URL (themealdb or cocktaildb)
        if (product.imageUrl && (product.imageUrl.includes('themealdb') || product.imageUrl.includes('thecocktaildb'))) {
            usedUrls.add(product.imageUrl);
            continue;
        }

        let imageUrl = await fetchMealOrDrink(product.name);
        
        if (!imageUrl || usedUrls.has(imageUrl)) {
            // Find a unique placeholder
            let placeholderId = placeholders[pIdx % placeholders.length];
            imageUrl = `https://images.unsplash.com/photo-${placeholderId}?w=1000&q=80`;
            while (usedUrls.has(imageUrl)) {
                pIdx++;
                placeholderId = placeholders[pIdx % placeholders.length];
                imageUrl = `https://images.unsplash.com/photo-${placeholderId}?w=1000&q=80`;
            }
            pIdx++;
        }
        
        usedUrls.add(imageUrl);
        console.log(`Setting ${product.name} => ${imageUrl}`);
        
        await prisma.product.update({
            where: { id: product.id },
            data: { imageUrl }
        });
        
        // Minor delay to respect APIs
        await new Promise(r => setTimeout(r, 100));
    }
    console.log('DONE!');
}
main().finally(() => prisma.$disconnect());
