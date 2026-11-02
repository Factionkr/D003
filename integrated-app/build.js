/**
 * StyleAI (D003 Integrated App) Production Build Script
 * Generates optimized static assets into ./dist and ../docs for GitHub Pages deployment.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, 'public');
const DIST_DIR = path.join(__dirname, 'dist');
const DOCS_DIR = path.join(__dirname, '..', 'docs');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function buildTarget(targetDir, label) {
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  copyDirSync(PUBLIC_DIR, targetDir);

  // SPA fallback (404.html) & GitHub Pages Jekyll bypass (.nojekyll)
  const indexHtml = path.join(targetDir, 'index.html');
  const notFoundHtml = path.join(targetDir, '404.html');
  if (fs.existsSync(indexHtml)) {
    fs.copyFileSync(indexHtml, notFoundHtml);
  }
  fs.writeFileSync(path.join(targetDir, '.nojekyll'), '', 'utf8');

  console.log(`✅ [${label}] 빌드 완료 -> ${targetDir}`);
}

console.log('================================================================');
console.log('🚀 StyleAI (D003 통합 앱) 프로덕션 빌드를 시작합니다...');
console.log('================================================================');

buildTarget(DIST_DIR, 'integrated-app/dist');
buildTarget(DOCS_DIR, 'docs (GitHub Pages)');

console.log('================================================================');
console.log('✨ 모든 프로덕션 빌드 아티팩트 생성이 완료되었습니다!');
console.log('================================================================');

