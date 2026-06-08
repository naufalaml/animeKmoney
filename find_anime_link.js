import * as cheerio from 'cheerio';

async function check() {
  try {
    const url = 'https://samehadaku.li/one-piece-episode-1165-subtitle-indonesia/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("=== Checking breadcrumbs and parent anime links ===");
    // Usually there's a breadcrumb with home > anime-title > episode-number
    // Let's inspect links that contain "/anime/" on the episode page
    $('a[href*="/anime/"]').each((i, el) => {
      console.log(`Link ${i}: text: ${$(el).text().trim()}, href: ${$(el).attr('href')}`);
    });
    
    console.log("\n=== Checking breadcrumbs selector ===");
    $('.breadcrumbs a, .breadcrumb a, .crumbs a').each((i, el) => {
      console.log(`Breadcrumb ${i}: text: ${$(el).text().trim()}, href: ${$(el).attr('href')}`);
    });

    console.log("\n=== Checking page title elements ===");
    console.log(`H1 text: ${$('h1').text().trim()}`);
    console.log(`Title tag: ${$('title').text().trim()}`);
  } catch (e) {
    console.error(e);
  }
}

check();
