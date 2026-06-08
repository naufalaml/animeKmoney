import * as cheerio from 'cheerio';

async function check() {
  try {
    const url = 'https://samehadaku.li/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("=== Titles of articles/posts ===");
    const articles = $('article, .animepost, .animpost, .post-show, .episodelist');
    console.log(`Found ${articles.length} articles`);
    articles.slice(0, 10).each((i, el) => {
      console.log(`Index ${i}:`);
      console.log(`  HTML snippet: ${$(el).html().substring(0, 300).replace(/\s+/g, ' ')}`);
    });
    
    console.log("\n=== Checking links under some lists ===");
    $('a').slice(0, 100).each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && (href.includes('/anime/') || href.includes('/episode/'))) {
        console.log(`Link: ${text} -> ${href}`);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

check();
