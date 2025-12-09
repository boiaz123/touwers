const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const tar = require('tar');

async function createPortableExecutable() {
  console.log('Creating portable executable...');
  
  const distDir = path.join(__dirname, 'dist');
  const appDir = path.join(distDir, 'app');
  const publicDir = path.join(__dirname, 'public');
  const nodeModulesDir = path.join(__dirname, 'node_modules');
  
  // Create dist directory if it doesn't exist
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create app directory
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  
  // Copy main files
  const filesToCopy = ['main.js', 'preload.js', 'server.js', 'package.json'];
  for (const file of filesToCopy) {
    fs.copyFileSync(
      path.join(__dirname, file),
      path.join(appDir, file)
    );
  }
  
  // Copy public directory
  copyDirSync(publicDir, path.join(appDir, 'public'));
  
  // Copy node_modules (essential only)
  const essentialModules = ['express', 'cors'];
  const destNodeModules = path.join(appDir, 'node_modules');
  fs.mkdirSync(destNodeModules, { recursive: true });
  
  for (const mod of essentialModules) {
    const src = path.join(nodeModulesDir, mod);
    const dest = path.join(destNodeModules, mod);
    if (fs.existsSync(src)) {
      copyDirSync(src, dest);
    }
  }
  
  console.log('✓ Portable app created in:', appDir);
  console.log('\nTo use: Run "node app/server.js" or use electron-app shortcut');
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

createPortableExecutable().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
