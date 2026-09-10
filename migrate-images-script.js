const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let updatedCount = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Check if file has <img>
  if (/<img\s/.test(content)) {
    // Add import if not exists
    if (!/import Image from (['"])next\/image\1/.test(content)) {
      // Find the last import statement or the beginning of the file
      const importRegex = /^import\s+.*?;?\s*$/gm;
      let lastImportIndex = 0;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastImportIndex = match.index + match[0].length;
      }
      
      const importStmt = `import Image from 'next/image';\n`;
      if (lastImportIndex === 0) {
        content = importStmt + content;
      } else {
        content = content.slice(0, lastImportIndex) + '\n' + importStmt + content.slice(lastImportIndex);
      }
    }

    // Replace <img ... /> with <Image ... width={800} height={800} />
    // We need to carefully replace it.
    content = content.replace(/<img\s([^>]+?)(\/?)>/g, (match, attrs, selfClose) => {
      // Check if width and height are already present
      const hasWidth = /\bwidth=/.test(attrs);
      const hasHeight = /\bheight=/.test(attrs);
      const hasFill = /\bfill\b/.test(attrs);

      let newAttrs = attrs;
      if (!hasFill) {
         if (!hasWidth) newAttrs += ' width={800}';
         if (!hasHeight) newAttrs += ' height={800}';
      }
      
      // Make sure it's self closing for Image
      return `<Image ${newAttrs.trim()} />`;
    });

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
      updatedCount++;
    }
  }
}

console.log(`Migration complete. Updated ${updatedCount} files.`);
