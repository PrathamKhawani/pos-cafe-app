const https = require('https');

async function fetchWikiImage(query) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'en.wikipedia.org',
            path: `/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(query)}`,
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
                    if (firstPage && firstPage.original && firstPage.original.source) {
                        resolve(firstPage.original.source);
                    } else {
                        const searchPath = `/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' food')}&format=json`;
                        const searchOptions = { ...options, path: searchPath };
                        https.get(searchOptions, (res2) => {
                            let data2 = '';
                            res2.on('data', chunk => data2 += chunk);
                            res2.on('end', () => {
                                const json2 = JSON.parse(data2);
                                if (json2.query && json2.query.search && json2.query.search.length > 0) {
                                    const title = json2.query.search[0].title;
                                    const path3 = `/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title)}`;
                                    const options3 = { ...options, path: path3 };
                                    https.get(options3, (res3) => {
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

(async () => {
    console.log(await fetchWikiImage('Pepperoni'));
    console.log(await fetchWikiImage('Carbonara'));
    console.log(await fetchWikiImage('Paneer Tikka Masala'));
})();
