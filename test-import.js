// Quick script to test import
const fs = require('fs');
const path = require('path');

async function run() {
    // Read CSV
    const csvPath = path.join(__dirname, 'gmart-products.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // POST to local server
    const response = await fetch('http://localhost:5000/api/admin/import-gmart-products', {
        method: 'POST',
        body: new FormData()
    });

    console.log('Response:', await response.json());
}

run().catch(console.error);
