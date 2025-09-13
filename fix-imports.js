const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const srcDir = path.join(process.cwd(), 'client', 'src');
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Find all @/ imports
      const matches = content.match(/@\/[^"']+/g);
      if (matches) {
        matches.forEach(match => {
          const importPath = match.slice(2); // Remove @/
          const targetPath = path.join(srcDir, importPath);
          const relativePath = path.relative(dir, targetPath).replace(/\\/g, '/');
          content = content.replace(match, relativePath.startsWith('.') ? relativePath : './' + relativePath);
        });
      }
      
      // Replace @shared/ imports
      const sharedMatches = content.match(/@shared\/[^"']+/g);
      if (sharedMatches) {
        sharedMatches.forEach(match => {
          const importPath = match.slice(7); // Remove @shared/
          const targetPath = path.join(process.cwd(), 'shared', importPath);
          const relativePath = path.relative(dir, targetPath).replace(/\\/g, '/');
          content = content.replace(match, relativePath);
        });
      }
      
      fs.writeFileSync(fullPath, content);
    }
  });
}

const srcDir = path.join(process.cwd(), 'client', 'src');
fixImports(srcDir);