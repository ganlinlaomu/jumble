const fs = require('fs');
const path = require('path');

// 源文件和目标文件路径
const sourceFile = path.join(__dirname, 'public', 'custom-sw.js');
const destFile = path.join(__dirname, 'dist', 'sw.js');

// 复制Service Worker文件
function copyServiceWorker() {
  try {
    // 确保dist目录存在
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // 复制文件
    fs.copyFileSync(sourceFile, destFile);
    console.log('✅ Service Worker copied successfully to dist/sw.js');
  } catch (error) {
    console.error('❌ Failed to copy Service Worker:', error);
  }
}

// 执行复制
copyServiceWorker();