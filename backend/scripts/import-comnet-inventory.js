/**
 * ComNet Inventory Import Script (Database Edition)
 * ==================================================
 * Imports enterprise hardware catalog from the ComNet inventory Excel spreadsheet
 * directly into the database persistence tier (productRepository, brandRepository,
 * categoryRepository, MongoDB Atlas & Firestore) instead of hardcoding into files.
 *
 * Usage:
 *   node backend/scripts/import-comnet-inventory.js
 *   or: npm run import:inventory
 */

const { spawn } = require('child_process');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../src/scripts/import-inventory.ts');

const tsxPath = path.resolve(__dirname, '../../node_modules/.bin/tsx');
const isWin = process.platform === 'win32';
const tsxCmd = isWin ? `${tsxPath}.cmd` : tsxPath;

console.log('🚀 Invoking Database Inventory Importer...');

const child = spawn(tsxCmd, [scriptPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
  shell: isWin,
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✨ Inventory successfully imported and synchronized with database!');
  } else {
    console.error(`Import process exited with code ${code}`);
  }
  process.exit(code || 0);
});
