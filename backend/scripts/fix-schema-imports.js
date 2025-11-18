import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const files = [
  join(__dirname, '../dist/db/schema-formfiller.js'),
  join(__dirname, '../dist/db/schema-formfiller-privacy.js')
];

for (const file of files) {
  try {
    let content = readFileSync(file, 'utf8');
    content = content.replace(/from '\.\/schema'/g, "from './schema.js'");
    writeFileSync(file, content);
    console.log(`Fixed imports in ${file}`);
  } catch (err) {
    console.error(`Could not fix ${file}:`, err.message);
  }
}
