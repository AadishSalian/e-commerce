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

const newImages = [
  '/images/craft-hero.jpg',
  '/images/craft-tools.jpg',
  '/images/craft-stitch.jpg',
  '/images/craft-final.jpg'
];

let counter = 0;
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\/images\/craft-[1-5]\.svg/g, () => {
      const replacement = newImages[counter % newImages.length];
      counter++;
      return replacement;
    });
    fs.writeFileSync(file, content);
  }
}
console.log('Replaced successfully');
