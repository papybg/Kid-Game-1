const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile() && (full.endsWith('.js') || full.endsWith('.mjs'))) {
      files.push(full);
    }
  }
  return files;
}

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Add .js to relative import paths that don't have an extension
  // e.g. import x from "./routes" or import y from "../shared/schema" -> add .js
  content = content.replace(/(from\s+['\"])(\.\.?(?:\/[^'";]+)*)(['\"])/g, (m, p1, p2, p3) => {
    // If it already ends with extension, leave it
    if (/\.[a-zA-Z0-9]+$/.test(p2)) return m;
    return p1 + p2 + '.js' + p3;
  });
  fs.writeFileSync(file, content, 'utf8');
}

const dist = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(dist)) {
  console.error('dist directory not found, skipping fix-dist-imports');
  process.exit(0);
}

const files = walk(dist);
for (const f of files) {
  fixFile(f);
}
console.log('Fixed imports in', files.length, 'files');
