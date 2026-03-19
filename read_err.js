const fs = require('fs');
const content = fs.readFileSync('check_err.txt', 'utf16le');
console.log(content.substring(0, 3000));
