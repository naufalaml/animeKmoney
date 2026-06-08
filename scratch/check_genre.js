const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function testGenre() {
  const url = 'https://samehadaku.li/genre/comedy/';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    const $ = cheerio.load(html);
    const items = [];
    $('article, .animepost, .animpost, .bsx').each((i, el) => {
      const title = $(el).find('img').attr('title') || $(el).find('h2, h3').text().trim() || '';
      const href = $(el).find('a').attr('href') || '';
      items.push({ title, href });
    });
    console.log('Parsed items count:', items.length);
    if (items.length > 0) {
      console.log('First item:', items[0]);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

testGenre();
