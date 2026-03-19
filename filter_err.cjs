const fs = require('fs');
let text = fs.readFileSync('check_err.txt', 'utf16le');
let found = false;
let errors = [];
text.split('\n').forEach(l => {
  if (l.includes('paymentMethod') || l.includes('routes.ts') || l.includes('checkout.tsx') || l.includes('schema.ts')) {
    errors.push(l);
    found = true;
  }
});
if (!found) {
  console.log('No TS errors related to checkout, routes, or schema!');
} else {
  console.log(errors.join('\n'));
}
