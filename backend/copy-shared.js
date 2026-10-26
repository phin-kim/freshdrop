import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(backendDirectory, '../shared/dist');
const destination = path.resolve(backendDirectory, 'dist/shared');

if (!fs.existsSync(source)) {
    throw new Error(
        `Compiled shared modules were not found at ${source}. Build the shared project first.`
    );
}

fs.cpSync(source, destination, { recursive: true, force: true });
console.log('Compiled shared modules copied to backend/dist/shared.');
