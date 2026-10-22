import { existsSync } from 'node:fs';
import app from './app.js';

const rootDir = import.meta.dirname;
const port = 3000;

// Load .env before the server starts
if (existsSync(`${rootDir}/.env`)) {
  process.loadEnvFile(`${rootDir}/.env`);
}

app.listen(port, () => {
  console.log(`App running on port ${port}!!!`);
});
