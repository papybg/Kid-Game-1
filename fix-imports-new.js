const fs = require('fs');
const path = require('path');

function getAllFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    entries.forEach(entry => {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

function fixImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const srcDir = path.join(process.cwd(), 'client', 'src');
  const sharedDir = path.join(process.cwd(), 'shared');
  const fileDir = path.dirname(filePath);
  
  // Find all @/ imports
  let newContent = content.replace(/@\/([^"']+)/g, (match, importPath) => {
    const absoluteImportPath = path.join(srcDir, importPath);
    const relativeImportPath = path.relative(fileDir, absoluteImportPath);
    // Ensure forward slashes and add ./ if needed
    const normalizedPath = relativeImportPath.replace(/\\/g, '/');
    return normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath;
  });
  
  // Fix @shared/ imports
  newContent = newContent.replace(/@shared\/([^"']+)/g, (match, importPath) => {
    const absoluteImportPath = path.join(sharedDir, importPath);
    const relativeImportPath = path.relative(fileDir, absoluteImportPath);
    // Ensure forward slashes and add ./ if needed
    const normalizedPath = relativeImportPath.replace(/\\/g, '/');
    return normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath;
  });
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Fixed imports in:', filePath);
  }
}

const srcDir = path.join(process.cwd(), 'client', 'src');
const files = getAllFiles(srcDir);

files.forEach(file => {
  try {
    fixImports(file);
  } catch (error) {
    console.error('Error processing file:', file, error);
  }
});