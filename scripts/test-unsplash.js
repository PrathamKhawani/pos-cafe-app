const https = require('https');

async function fetchImageFor(query) {
    return new Promise((resolve, reject) => {
        const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+(\?[\w=%&\.\-]+)?/g);
                if (match) {
                    // Filter out some common non-photo links and remove duplicates
                    const validUrls = match.filter(u => !u.includes('profile-') && !u.includes('premium_')).map(u => u.split('?')[0]);
                    resolve(validUrls.length > 0 ? Array.from(new Set(validUrls)).slice(0, 5) : null);
                } else {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

fetchImageFor('burger').then(console.log);
