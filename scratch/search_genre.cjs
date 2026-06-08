const cheerio = require('cheerio');

async function search() {
  const url = 'https://samehadaku.li/anime/one-piece/';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('=== Checking all links on page ===');
    const links = [];
    $('a').each((i, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (href && (href.includes('genre') || text.toLowerCase().includes('genre'))) {
        links.push({ text, href });
      }
    });
    console.log('Found links:', links.slice(0, 20));
    
    console.log('\n=== Checking genre container ===');
    const genreElements = $('.genre-info, .genres, .genre, .animegenre, .genreflect, .info-content a[href*="/genre/"], .spe a[href*="/genre/"]');
    console.log('Found genre elements count:', genreElements.length);
    genreElements.each((i, el) => {
      console.log(`El ${i}:`, $(el).text(), $(el).attr('href'));
    });
  } catch (e) {
    console.error(e);
  }
}

search();
