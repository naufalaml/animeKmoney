import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import * as cheerio from 'cheerio'
import type { IncomingMessage, ServerResponse } from 'http'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'samehadaku-proxy',
      configureServer(server) {
        server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
          if (urlObj.pathname.startsWith('/api/samehadaku/')) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            try {
              if (urlObj.pathname === '/api/samehadaku/trending') {
                const html = await fetchSamehadaku('https://samehadaku.li/');
                const $ = cheerio.load(html);
                const animes: any[] = [];
                
                $('.animpost, .bsx, .utao').each((_i, el) => {
                  const title = $(el).find('a').attr('title') || $(el).find('.title').text().trim() || '';
                  const href = $(el).find('a').attr('href') || '';
                  const rawImg = $(el).find('img').attr('data-lazy-src') || 
                                 $(el).find('img').attr('data-src') || 
                                 $(el).find('img').attr('src') || '';
                  const img = makeImageHD(rawImg);
                  const epx = $(el).find('.epx').text().trim() || $(el).find('.epz').text().trim() || '';
                  
                  const animeSlug = getAnimeSlugFromEpisodeUrl(href);
                  if (animeSlug) {
                    animes.push({
                      id: animeSlug,
                      title: cleanAnimeTitle(title),
                      originalName: '',
                      posterUrl: img,
                      backdropUrl: img,
                      description: `Episode terbaru ${epx} dengan Subtitle Indonesia.`,
                      genre: 'Anime',
                      genreIds: [16],
                      episodes: 1,
                      seasons: [],
                      voteAverage: 8.0,
                      firstAirDate: '',
                      popularity: 100,
                      duration: '24m',
                      trending: true,
                      originCountry: ['JP'],
                      url: href
                    });
                  }
                });
                
                res.end(JSON.stringify({ animes }));
              }
              else if (urlObj.pathname === '/api/samehadaku/search') {
                const query = urlObj.searchParams.get('q') || '';
                const html = await fetchSamehadaku(`https://samehadaku.li/?s=${encodeURIComponent(query)}`);
                const $ = cheerio.load(html);
                const animes: any[] = [];
                
                $('article, .animepost, .animpost, .bsx').each((_i, el) => {
                  const title = $(el).find('img').attr('title') || $(el).find('h2, h3').text().trim() || '';
                  const href = $(el).find('a').attr('href') || '';
                  const rawImg = $(el).find('img').attr('data-lazy-src') || 
                                 $(el).find('img').attr('data-src') || 
                                 $(el).find('img').attr('src') || '';
                  const img = makeImageHD(rawImg);
                  
                  const slug = href.replace(/\/$/, '').split('/').pop() || '';
                  if (slug && href.includes('/anime/')) {
                    animes.push({
                      id: slug,
                      title,
                      originalName: title,
                      posterUrl: img,
                      backdropUrl: img,
                      description: 'Tonton anime seru lengkap dengan subtitle Indonesia.',
                      genre: 'Anime',
                      genreIds: [16],
                      episodes: 0,
                      seasons: [],
                      voteAverage: 8.5,
                      firstAirDate: '',
                      popularity: 80,
                      duration: '24m',
                      trending: false,
                      originCountry: ['JP'],
                      url: href
                    });
                  }
                });
                
                res.end(JSON.stringify({ animes }));
              }
              else if (urlObj.pathname === '/api/samehadaku/genre') {
                const genreSlug = urlObj.searchParams.get('slug') || '';
                const page = urlObj.searchParams.get('page') || '1';
                const url = page === '1' 
                  ? `https://samehadaku.li/genres/${genreSlug}/`
                  : `https://samehadaku.li/genres/${genreSlug}/page/${page}/`;
                  
                const html = await fetchSamehadaku(url);
                const $ = cheerio.load(html);
                const animes: any[] = [];
                
                $('article, .animepost, .animpost, .bsx').each((_i, el) => {
                  const title = $(el).find('img').attr('title') || $(el).find('h2, h3').text().trim() || '';
                  const href = $(el).find('a').attr('href') || '';
                  const rawImg = $(el).find('img').attr('data-lazy-src') || 
                                 $(el).find('img').attr('data-src') || 
                                 $(el).find('img').attr('src') || '';
                  const img = makeImageHD(rawImg);
                  
                  const slug = href.replace(/\/$/, '').split('/').pop() || '';
                  if (slug && href.includes('/anime/')) {
                    animes.push({
                      id: slug,
                      title,
                      originalName: title,
                      posterUrl: img,
                      backdropUrl: img,
                      description: `Tonton anime genre ${genreSlug} lengkap dengan subtitle Indonesia.`,
                      genre: genreSlug,
                      genreIds: [16],
                      episodes: 0,
                      seasons: [],
                      voteAverage: 8.5,
                      firstAirDate: '',
                      popularity: 80,
                      duration: '24m',
                      trending: false,
                      originCountry: ['JP'],
                      url: href
                    });
                  }
                });
                
                let totalPages = 1;
                $('.page-numbers, .pagination a').each((_i, el) => {
                  const num = parseInt($(el).text().trim(), 10);
                  if (num && num > totalPages) {
                    totalPages = num;
                  }
                });
                
                res.end(JSON.stringify({ animes, totalPages }));
              }
              else if (urlObj.pathname === '/api/samehadaku/details') {
                const slug = urlObj.searchParams.get('slug') || '';
                const html = await fetchSamehadaku(`https://samehadaku.li/anime/${slug}/`);
                const $ = cheerio.load(html);
                
                const title = $('.entry-title').text().trim();
                const desc = $('.entry-content[itemprop="description"], .desc, .sinopsis').text().trim();
                const rawImg = $('.thumb img').attr('data-lazy-src') || 
                               $('.thumb img').attr('data-src') || 
                               $('.thumb img').attr('src') || '';
                const img = makeImageHD(rawImg);
                const rating = $('.rating [itemprop="ratingValue"], .rating strong, .score').text().trim() || '8.5';
                
                const genresList: string[] = [];
                $('a[href*="/genres/"]').each((_i, el) => {
                  genresList.push($(el).text().trim());
                });
                const genre = genresList.filter((v, idx, self) => self.indexOf(v) === idx).join(', ') || 'Anime';
                
                const episodes: any[] = [];
                $('.eplister li').each((i, el) => {
                  const epUrl = $(el).find('a').attr('href') || '';
                  const epTitle = $(el).find('.epl-title').text().trim() || `Episode ${i + 1}`;
                  const epNumText = $(el).find('.epl-num').text().trim();
                  const epNum = parseInt(epNumText, 10) || (i + 1);
                  const epDate = $(el).find('.epl-date').text().trim() || '';
                  
                  episodes.push({
                    id: epUrl.replace(/\/$/, '').split('/').pop() || epNum,
                    name: epTitle,
                    number: epNum,
                    season: 1,
                    seasonNumber: 1,
                    airDate: epDate,
                    overview: 'Tonton episode ini di server streaming Samehadaku.',
                    stillPath: null,
                    voteAverage: parseFloat(rating.replace(/[^0-9.]/g, '')) || 8.5,
                    url: epUrl
                  });
                });
                
                episodes.reverse();
                
                const responseData = {
                  title,
                  description: desc,
                  posterUrl: img,
                  backdropUrl: img,
                  genre,
                  voteAverage: parseFloat(rating.replace(/[^0-9.]/g, '')) || 8.5,
                  episodes: episodes.length,
                  episodesList: episodes,
                  seasons: [
                    {
                      id: 1,
                      name: 'Season 1',
                      seasonNumber: 1,
                      episodeCount: episodes.length,
                      overview: '',
                      posterPath: null,
                      airDate: null
                    }
                  ]
                };
                
                res.end(JSON.stringify(responseData));
              }
              else if (urlObj.pathname === '/api/samehadaku/episode') {
                const epUrl = urlObj.searchParams.get('url') || '';
                const html = await fetchSamehadaku(epUrl);
                const $ = cheerio.load(html);
                
                const servers: any[] = [];
                
                const defaultIframeSrc = $('.player-embed iframe, #pembed iframe').attr('src');
                if (defaultIframeSrc) {
                  servers.push({ name: 'Default Server', src: defaultIframeSrc });
                }
                
                $('select.mirror option, .mirror option').each((_i, el) => {
                  const name = $(el).text().trim();
                  const value = $(el).attr('value');
                  if (value && value.trim() !== '') {
                    try {
                      const decoded = Buffer.from(value, 'base64').toString('utf-8');
                      const $iframe = cheerio.load(decoded)('iframe');
                      const src = $iframe.attr('src');
                      if (src) {
                        servers.push({ name, src });
                      }
                    } catch (err) {
                      console.error('Error decoding mirror value:', err);
                    }
                  }
                });
                
                res.end(JSON.stringify({ servers }));
              }
              else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
              }
            } catch (error: any) {
              console.error('Proxy Error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message || 'Internal proxy error' }));
            }
          } else {
            next();
          }
        });
      }
    }
  ]
})

async function fetchSamehadaku(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5'
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function getAnimeSlugFromEpisodeUrl(url: string): string {
  const path = url.replace(/\/$/, '').split('/').pop() || '';
  const clean = path.replace(/-episode-\d+.*$/i, '');
  return clean;
}

function cleanAnimeTitle(title: string): string {
  return title
    .replace(/\s+Episode\s+\d+.*$/i, '')
    .replace(/\s+Subtitle\s+Indonesia.*$/i, '')
    .trim();
}

function makeImageHD(url: string): string {
  if (!url) return '';
  // Remove WordPress Photon resize query parameters
  let cleanUrl = url.split('?')[0];
  // Remove thumbnail crop dimensions (like -150x150 or -300x200) before file extension
  cleanUrl = cleanUrl.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
  return cleanUrl;
}

