const cheerio = require('cheerio');

async function checkGenres() {
  const url = 'https://samehadaku.li/anime/one-piece/';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('=== Genre links found ===');
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && href.includes('/genre/')) {
        console.log(`${text}: ${href}`);
      }
    });
  } catch (e) {
    console.error('Error:', e);
  }
}

checkGenres();
