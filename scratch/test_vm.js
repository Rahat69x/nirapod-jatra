const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('index.html', 'utf8');
const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match, idx = 0;
while ((match = regex.exec(html)) !== null) {
  idx++;
  if (idx === 5) {
    try {
      new vm.Script(match[1]);
      console.log('Script 5 compiled with 0 errors!');
    } catch (e) {
      console.log('VM Script Error:', e.message);
      console.log(e.stack);
    }
  }
}
