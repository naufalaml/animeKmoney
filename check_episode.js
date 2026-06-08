import * as cheerio from 'cheerio';

async function check() {
  try {
    const url = 'https://samehadaku.li/one-piece-episode-1165-subtitle-indonesia/';
    console.log(`Fetching episode page: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("=== Checking video player container ===");
    const players = $('.player-embed, .embed-holder, .video-content, #player_embed, iframe, .mirror, select#select-mirror, .player-area');
    console.log(`Found player/embed/mirror elements count: ${players.length}`);
    players.each((i, el) => {
      console.log(`Element ${i} tag: ${el.name}, class: ${$(el).attr('class')}, id: ${$(el).attr('id')}`);
      console.log(`  HTML: ${$.html(el).substring(0, 300).replace(/\s+/g, ' ')}`);
    });

    console.log("\n=== Checking all iframe elements ===");
    $('iframe').each((i, el) => {
      console.log(`Iframe ${i} src: ${$(el).attr('src')}`);
    });

    console.log("\n=== Checking mirror/download sections ===");
    $('.download-link, .mirror-link, .download, #download').each((i, el) => {
      console.log(`Download/Mirror block ${i} HTML: ${$.html(el).substring(0, 300).replace(/\s+/g, ' ')}`);
    });

    console.log("\n=== Checking select-mirror option tags ===");
    $('select option, .mirror option').each((i, el) => {
      console.log(`Option ${i} text: ${$(el).text().trim()}, value: ${$(el).attr('value')}`);
    });
  } catch (e) {
    console.error(e);
  }
}

check();
