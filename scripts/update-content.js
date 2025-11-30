#!/usr/bin/env node
/**
 * Build script to update content.json from magentaA11y submodule
 * 
 * This script:
 * 1. Pulls the latest from the magentaA11y submodule
 * 2. Runs npm install and npm run build
 * 3. Copies the generated content.json to /data/content.json
 */

import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const submoduleDir = join(rootDir, 'data', 'magentaA11y');
const sourceFile = join(submoduleDir, 'src', 'shared', 'content.json');
const destFile = join(rootDir, 'data', 'content.json');

function run(cmd, cwd = rootDir) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

async function main() {
  console.log('🔄 Updating MagentaA11y content...\n');

  // Initialize submodule if needed
  if (!existsSync(join(submoduleDir, '.git'))) {
    console.log('📥 Initializing submodule...');
    run('git submodule update --init');
  }

  // Pull latest from main branch
  console.log('📥 Pulling latest from magentaA11y...');
  run('git pull origin main', submoduleDir);

  // Install dependencies
  console.log('\n📦 Installing dependencies...');
  run('npm install', submoduleDir);

  // Build the project
  console.log('\n🔨 Building magentaA11y...');
  run('npm run build', submoduleDir);

  // Copy content.json to /data
  if (!existsSync(sourceFile)) {
    console.error(`❌ Build failed: ${sourceFile} not found`);
    process.exit(1);
  }

  console.log('\n📋 Copying content.json to /data...');
  copyFileSync(sourceFile, destFile);
  console.log(`✅ Copied to ${destFile}`);

  console.log('\n✨ Content update complete!');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
