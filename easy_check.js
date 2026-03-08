const http = require('http');

http.get('http://localhost:5000/api/admin/providers', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const providers = JSON.parse(data);
        const ab = providers.filter(p => p.businessName.toLowerCase().includes('abhiruchi'));
        console.log("ABHIRUCHI DATA:", ab);
    });
});
