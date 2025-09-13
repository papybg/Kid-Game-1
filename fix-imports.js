const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace @/ imports with relative paths
      const relativePath = path.relative(dir, path.join(process.cwd(), 'client', 'src')).replace(/\\/g, '/');
      content = content.replace(/@\//g, `${relativePath ? relativePath + '/' : './'}`);
      
      // Replace @shared/ imports with relative paths
      const sharedPath = path.relative(dir, path.join(process.cwd(), 'shared')).replace(/\\/g, '/');
      content = content.replace(/@shared\//g, `${sharedPath ? sharedPath + '/' : '../shared/'}`);
      
      fs.writeFileSync(fullPath, content);
    }
  });
}

const srcDir = path.join(process.cwd(), 'client', 'src');
fixImports(srcDir);