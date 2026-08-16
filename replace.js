const fs = require('fs');
const files = [
  'src/components/storytelling/CinematicHero.tsx',
  'src/components/storytelling/CraftingJourney.tsx',
  'src/components/storytelling/CraftsmanshipDetails.tsx',
  'src/components/storytelling/EditorialIntro.tsx',
  'src/components/storytelling/InteractiveHotspots.tsx',
  'src/components/storytelling/MaterialShowcase.tsx',
  'src/app/craftsmanship/page.tsx'
];

let counter = 1;
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/https:\/\/images\.unsplash\.com\/[^\`\"\'\s]+/g, () => {
      const replacement = '/images/craft-' + counter + '.svg';
      counter = counter > 4 ? 1 : counter + 1;
      return replacement;
    });
    fs.writeFileSync(file, content);
  }
}
console.log('Replaced');
