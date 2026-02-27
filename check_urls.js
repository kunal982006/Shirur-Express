import https from 'https';

const candidateIds = [
    '1555126634-fa0256860010', // Vada Pav (invalid)
    '1589302168068-964664d93cb0', // Biryani (valid)
    '1601050690597-df0568f70950', // Samosa (valid)
    '1565557613262-11cf0fe7f29a', // Pav Bhaji (invalid)
    '1585937421612-70a008356fbe', // Dosa (invalid)
    '1610192305389-7ff4d4514ac0', // Chaat (invalid)
    '1574041162489-35431ff4edbc', // Pani Puri (invalid)
    '1534422298391-e4f8c172dddb', // Momos,
    '1626200419199-391ae4be7a41', // Momos / dumpling
    '1645177628172-a94c1f96e6db', // Dosa / Crepe
    '1625220194771-7ebdea0b70b9', // Momos
    '1594998893017-36147cbcae05', // Samosa / fried snack
    '1563122870624-9dfa54058d92', // Random street food
    '1546069901-ba9599a7e63c', // food
    '1606491956689-2ea866880c84', // food
    '1512621776951-a57141f2eefd', // salad
    '1476224203421-9ce8e0b25207',
    '1565299624946-b28f40a0ae38', // pizza
    '1564834724105-924b429cd19a', // food
    '1567620832905-315ce3dcb96b',
    '1512152272829-400c7f1eaf40',
    '1496116218417-1f9076939943'
];

async function checkUrl(id) {
    const url = `https://images.unsplash.com/photo-${id}?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3`;
    return new Promise((resolve) => {
        https.get(url, (res) => {
            resolve({ id, status: res.statusCode, url });
        }).on('error', () => resolve({ id, status: 500, url }));
    });
}

async function run() {
    const results = await Promise.all(candidateIds.map(checkUrl));
    const valid = results.filter(r => r.status === 200 || r.status === 302);
    console.log('VALID URLS:');
    valid.slice(0, 10).forEach(v => console.log('"' + v.url + '",'));
}

run();
