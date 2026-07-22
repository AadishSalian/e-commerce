async function search(query) {
  const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    // find a few unique IDs
    const matches = [...text.matchAll(/"id":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
    const unique = [...new Set(matches)];
    if (unique.length > 0) {
      console.log(`[${query}] ID: ${unique[2] || unique[0]}`); // pick second/third to avoid generic
    } else {
      console.log(`[${query}] No match.`);
    }
  } catch (e) {
    console.log(`[${query}] Error: ${e.message}`);
  }
}

async function run() {
  await search('tennis racket');
  await search('climbing harness');
  await search('merino wool shirt');
  await search('massage gun');
  await search('hiking backpack');
  await search('yoga mat');
  await search('trail running shoes');
  await search('leg recovery');
}

run();
