import * as cheerio from 'cheerio';

async function check() {
  try {
    const url = 'https://samehadaku.li/anime/one-piece/';
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const epItem = $('.eplister li').first();
    if (epItem.length > 0) {
      console.log(`Episode item HTML:`);
      console.log($.html(epItem));
    } else {
      console.log("No episode item found in .eplister!");
    }
  } catch (e) {
    console.error(e);
  }
}

check();
