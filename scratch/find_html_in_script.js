const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>\s*<\/body>/);
if (!scriptMatch) {
  console.log('No main script match!');
  process.exit(1);
}

const code = scriptMatch[1];
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith('<') && !line.trim().startsWith('<=') && !line.trim().startsWith('<<')) {
    console.log(`Line ${i + 1}: ${line.trim().substring(0, 80)}`);
  }
}
