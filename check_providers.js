const fs = require('fs');
try {
    const data = JSON.parse(fs.readFileSync('./providers.json', 'utf8'));
    const bakers = data.filter(p => JSON.stringify(p).toLowerCase().includes('cake') || JSON.stringify(p).toLowerCase().includes('bak'));
    console.log(bakers.map(p => ({ id: p.id, name: p.businessName, cat: p.categoryId })));
} catch (e) { console.error(e) }
