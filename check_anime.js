import * as cheerio from 'cheerio';

async function check() {
  try {
    const url = 'https://samehadaku.li/anime/one-piece/';
    console.log(`Fetching anime details: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("=== Checking title/description ===");
    console.log(`Title: ${$('.entry-title').text().trim()}`);
    console.log(`Synopsis: ${$('.entry-content[itemprop="description"], .desc, .sinopsis').text().trim().substring(0, 300)}`);
    
    console.log("\n=== Checking info elements ===");
    $('.info-content span, .spe span').each((i, el) => {
      console.log(`Info ${i}: ${$(el).text().trim()}`);
    });

    console.log("\n=== Checking rating/score ===");
    console.log(`Rating: ${$('.rating [itemprop="ratingValue"], .rating strong, .score').text().trim()}`);

    console.log("\n=== Checking episodes list ===");
    const episodes = $('.lstepsi li, .listeps li, .episodelist li');
    console.log(`Found ${episodes.length} episodes`);
    episodes.slice(0, 10).each((i, el) => {
      const epTitle = $(el).find('a').text().trim();
      const epUrl = $(el).find('a').attr('href');
      const epDate = $(el).find('.date').text().trim();
      console.log(`Episode ${i}:`);
      console.log(`  Title: ${epTitle}`);
      console.log(`  Url: ${epUrl}`);
      console.log(`  Date: ${epDate}`);
    });

    console.log("\n=== Checking alternative episode list selectors ===");
    const links = $('a');
    let epCount = 0;
    links.each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && href.includes('-subtitle-indonesia') && epCount < 10) {
        console.log(`Ep Link ${epCount}: ${text} -> ${href}`);
        epCount++;
      }
    });
  } catch (e) {
    console.error(e);
  }
}

check();
