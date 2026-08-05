const fs = require('fs');
const path = require('path');

const files = [
  'src/app/products/page.tsx',
  'src/app/accessories/page.tsx',
  'src/app/beauty/page.tsx',
  'src/app/electronics/page.tsx',
  'src/app/fashion/page.tsx',
  'src/app/home-furniture/page.tsx',
  'src/app/sports/page.tsx',
  'src/app/products/[id]/page.tsx',
  'src/app/search/page.tsx'
];

const basePath = process.cwd();

files.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  if (!content.includes('WishlistButton')) {
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    
    content = content.slice(0, endOfLastImport) + "\nimport { WishlistButton } from '@/components/ui';" + content.slice(endOfLastImport);
    changed = true;
  }
  
  const buttonRegex = /(<button[^>]*?openQuickView\((.*?)\)[^>]*?>[\s\S]*?<\/button>)/g;
  
  if (content.match(buttonRegex)) {
     if (!content.includes('<WishlistButton')) {
       content = content.replace(buttonRegex, '<WishlistButton product={$2} />\n                        $1');
       changed = true;
     }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
});
