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
    
    console.log("=== Checking latest episode elements on homepage ===");
    // Usually latest episodes are under a specific section or class
    // Let's find all '.post-show' or '.uplist' or elements containing episode lists
    const articles = $('.post-show .animpost, .post-show article, .upld .animpost, .upld article, .post-show .bsx, .post-show .utao');
    console.log(`Found ${articles.length} latest articles with specific classes`);
    
    // Fallback: search for any .animpost or .bsx or .utao
    const anyArticles = $('.animpost, .bsx, .utao');
    console.log(`Found ${anyArticles.length} general articles (.animpost, .bsx, .utao)`);
    
    anyArticles.slice(0, 5).each((i, el) => {
      console.log(`\nArticle ${i} HTML:`);
      console.log($.html(el).substring(0, 500).replace(/\s+/g, ' '));
      
      const title = $(el).find('a').attr('title') || $(el).find('.title').text().trim();
      const href = $(el).find('a').attr('href');
      const img = $(el).find('img').attr('src');
      const epNum = $(el).find('.ep').text().trim() || $(el).find('.epz').text().trim();
      
      console.log(`Extracted:`);
      console.log(`  Title: ${title}`);
      console.log(`  Link: ${href}`);
      console.log(`  Image: ${img}`);
      console.log(`  Episode Number/Info: ${epNum}`);
    });
  } catch (e) {
    console.error(e);
  }
}

check();
