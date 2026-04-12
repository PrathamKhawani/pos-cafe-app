const https = require('https');

async function fetchWikiImage(query) {
    return new Promise((resolve, reject) => {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const pages = json.query.pages;
                    const firstPage = Object.values(pages)[0];
                    if (firstPage && firstPage.original && firstPage.original.source) {
                        resolve(firstPage.original.source);
                    } else {
                        // try search
                        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json`;
                        https.get(searchUrl, (res2) => {
                            let data2 = '';
                            res2.on('data', chunk => data2 += chunk);
                            res2.on('end', () => {
                                const json2 = JSON.parse(data2);
                                if (json2.query.search.length > 0) {
                                    const title = json2.query.search[0].title;
                                    const url3 = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title)}`;
                                    https.get(url3, (res3) => {
                                        let data3 = '';
                                        res3.on('data', chunk => data3 += chunk);
                                        res3.on('end', () => {
                                            const json3 = JSON.parse(data3);
                                            const page3 = Object.values(json3.query.pages)[0];
                                            if (page3 && page3.original && page3.original.source) {
                                                resolve(page3.original.source);
                                            } else {
                                                resolve(null);
                                            }
                                        });
                                    }).on('error', reject);
                                } else {
                                    resolve(null);
                                }
                            });
                        }).on('error', reject);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

fetchWikiImage('Pepperoni').then(console.log);
