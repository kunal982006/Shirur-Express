
import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Sai\\Desktop\\grocery product list.csv', 'utf8');
const lines = content.split('\r\n'); // Handle windows newlines likely
const header = lines[0];
const row1 = lines[1];
fs.writeFileSync('csv_debug.txt', `HEADER: ${header}\nROW1: ${row1}`);
