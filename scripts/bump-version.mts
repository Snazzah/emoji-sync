import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const filesToUpdate = [
  join(__dirname, '..', 'package.json'),
  join(__dirname, '..', 'jsr.json'),
  join(__dirname, '..', 'src', 'common.ts')
];

const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Please provide a new version number.');
  process.exit(1);
}

filesToUpdate.forEach((filePath) => {
  const ext = filePath.split('.').pop();
  if (ext === 'json') {
    const json = JSON.parse(readFileSync(filePath, 'utf-8'));
    json.version = newVersion;
    writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
  } else if (ext === 'ts') {
    let content = readFileSync(filePath, 'utf-8');
    content = content.replace(/export const VERSION = '.*?';/, `export const VERSION = '${newVersion}';`);
    writeFileSync(filePath, content);
  }
});

console.log(`Version bumped to ${newVersion}`);
