import * as cheerio from 'cheerio';

async function check() {
  try {
    const query = 'one piece';
    const url = `https://samehadaku.li/?s=${encodeURIComponent(query)}`;
    console.log(`Fetching search URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("=== Checking search results ===");
    const articles = $('article, .animepost, .animpost');
    console.log(`Found ${articles.length} search results`);
    articles.each((i, el) => {
      const title = $(el).find('img').attr('title') || $(el).find('h2, h3').text().trim();
      const href = $(el).find('a').attr('href');
      const img = $(el).find('img').attr('src');
      console.log(`Result ${i}:`);
      console.log(`  Title: ${title}`);
      console.log(`  Link: ${href}`);
      console.log(`  Image: ${img}`);
    });
  } catch (e) {
    console.error(e);
  }
}

check();
