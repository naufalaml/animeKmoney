import type { Anime, Episode, TMDBGenre } from '../types';

// TMDB Compatibility variables
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function cleanTitleForSearch(title: string): string {
  if (!title) return '';
  return title
    .replace(/season\s+\d+/i, '')
    .replace(/part\s+\d+/i, '')
    .replace(/sub\s+indo/i, '')
    .replace(/subtitle\s+indonesia/i, '')
    .replace(/batch/i, '')
    .replace(/bd/i, '')
    .replace(/uncensored/i, '')
    .replace(/compressed/i, '')
    .replace(/s\d+/i, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return 'https://via.placeholder.com/500x750/121218/8b5cf6?text=No+Image';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null): string => {
  if (!path) return 'https://via.placeholder.com/1280x720/121218/8b5cf6?text=AnimeCuan';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/w1280${path}`;
};

export interface StreamingServer {
  id: string;
  name: string;
  url: (tmdbId: number | string, season: number, episode: number) => string;
}

export const STREAMING_SERVERS: StreamingServer[] = [
  {
    id: 'samehadaku_default',
    name: 'Server Utama (Samehadaku)',
    url: (id) => `https://samehadaku.li/anime/${id}/`
  },
  {
    id: 'bypass_server',
    name: '⚡ Server Cadangan (Demo Trailer & Bypass)',
    url: () => 'bypass'
  }
];

export const getEmbedUrl = (_tmdbId: number | string, _season: number = 1, _episode: number = 1, _serverId: string = 'samehadaku_default'): string => {
  return 'bypass'; // Not used anymore as we fetch links dynamically
};

// Fallback Anime Database
const FALLBACK_ANIMES: Anime[] = [
  {
    id: 'one-piece',
    title: "One Piece",
    originalName: "ワンピース",
    posterUrl: "https://i2.wp.com/samehadaku.li/wp-content/uploads/2024/02/1708080612-8881-138851.jpg",
    backdropUrl: "https://i2.wp.com/samehadaku.li/wp-content/uploads/2024/02/1708080612-8881-138851.jpg",
    description: "Tonton petualangan Luffy dan kru bajak laut Topi Jerami mencari harta karun legendaris One Piece lengkap dengan Subtitle Indonesia.",
    genre: "Action, Adventure, Comedy, Fantasy",
    genreIds: [10759, 16],
    episodes: 1100,
    seasons: [{ id: 1, name: "Season 1", seasonNumber: 1, episodeCount: 1100, overview: "Perjalanan menuju Grand Line.", posterPath: null, airDate: "1999" }],
    voteAverage: 8.7,
    firstAirDate: "1999-10-20",
    popularity: 180.5,
    duration: "24m",
    trending: true,
    originCountry: ["JP"],
    url: "https://samehadaku.li/anime/one-piece/"
  }
];

export async function getGenres(): Promise<TMDBGenre[]> {
  return [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation (Anime)' },
    { id: 35, name: 'Comedy' },
    { id: 18, name: 'Drama' },
    { id: 10765, name: 'Fantasy & Sci-Fi' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 53, name: 'Thriller' }
  ];
}

const GENRE_MAP: Record<number, string> = {
  10759: 'action',
  35: 'comedy',
  18: 'drama',
  10765: 'fantasy',
  36: 'historical',
  27: 'horror',
  9648: 'mystery',
  10749: 'romance',
  53: 'thriller',
  16: 'shounen'
};

// Fetch anime from local Samehadaku proxy
export async function getAnimes(page: number = 1, genreId?: number | null): Promise<{ animes: Anime[]; totalPages: number }> {
  try {
    const genreSlug = genreId ? GENRE_MAP[genreId] : null;
    let url = '/api/samehadaku/trending';
    if (genreSlug) {
      url = `/api/samehadaku/genre?slug=${genreSlug}&page=${page}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch anime');
    const data = await response.json();
    
    return { 
      animes: data.animes || [], 
      totalPages: data.totalPages || 1 
    };
  } catch (error) {
    console.error('Error fetching animes:', error);
    return { animes: FALLBACK_ANIMES, totalPages: 1 };
  }
}

export async function getTrendingAnimes(): Promise<Anime[]> {
  try {
    const response = await fetch('/api/samehadaku/trending');
    if (!response.ok) throw new Error('Failed to fetch trending');
    const data = await response.json();
    const list: Anime[] = (data.animes || []).slice(0, 6);
    
    // Enrich with TMDB high-res backdrops and posters
    const enrichedList = await Promise.all(
      list.map(async (anime) => {
        try {
          const cleanedTitle = cleanTitleForSearch(anime.title);
          const tmdbRes = await fetch(
            `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanedTitle)}`
          );
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            const bestResult = tmdbData.results?.[0];
            if (bestResult) {
              return {
                ...anime,
                backdropUrl: bestResult.backdrop_path 
                  ? `https://image.tmdb.org/t/p/w1280${bestResult.backdrop_path}` 
                  : anime.backdropUrl,
                posterUrl: bestResult.poster_path 
                  ? `https://image.tmdb.org/t/p/w780${bestResult.poster_path}` 
                  : anime.posterUrl,
                originalName: bestResult.original_name || bestResult.original_title || anime.originalName,
                voteAverage: bestResult.vote_average || anime.voteAverage
              };
            }
          }
        } catch (e) {
          console.error('Failed to enrich trending anime with TMDB:', e);
        }
        return anime;
      })
    );
    
    return enrichedList;
  } catch (error) {
    console.error('Error fetching trending:', error);
    return FALLBACK_ANIMES;
  }
}

export async function getAnimeDetails(id: number | string): Promise<Partial<Anime> | null> {
  try {
    const response = await fetch(`/api/samehadaku/details?slug=${id}`);
    if (!response.ok) throw new Error('Failed to fetch anime details');
    const data = await response.json();
    
    // Enrich details with TMDB high-res backdrop
    try {
      const cleanedTitle = cleanTitleForSearch(data.title || '');
      const tmdbRes = await fetch(
        `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanedTitle)}`
      );
      if (tmdbRes.ok) {
        const tmdbData = await tmdbRes.json();
        const bestResult = tmdbData.results?.[0];
        if (bestResult) {
          data.backdropUrl = bestResult.backdrop_path 
            ? `https://image.tmdb.org/t/p/w1280${bestResult.backdrop_path}` 
            : data.backdropUrl;
          data.posterUrl = bestResult.poster_path 
            ? `https://image.tmdb.org/t/p/w780${bestResult.poster_path}` 
            : data.posterUrl;
          data.originalName = bestResult.original_name || bestResult.original_title || data.originalName;
          data.voteAverage = bestResult.vote_average || data.voteAverage;
        }
      }
    } catch (e) {
      console.error('Failed to enrich details with TMDB:', e);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching anime details:', error);
    const local = FALLBACK_ANIMES.find(a => a.id === id);
    if (local) {
      return {
        episodes: local.episodes,
        seasons: local.seasons,
        duration: local.duration,
        description: local.description,
        genre: local.genre,
        posterUrl: local.posterUrl,
        backdropUrl: local.backdropUrl
      };
    }
    return null;
  }
}

export async function getSeasonEpisodes(id: number | string, _seasonNumber: number): Promise<Episode[]> {
  try {
    // In Samehadaku, episodes are loaded from the anime details page
    const response = await fetch(`/api/samehadaku/details?slug=${id}`);
    if (!response.ok) throw new Error('Failed to fetch episodes');
    const data = await response.json();
    return data.episodesList || [];
  } catch (error) {
    console.error('Error fetching season episodes:', error);
    return [];
  }
}

export async function searchAnimes(query: string): Promise<Anime[]> {
  try {
    const response = await fetch(`/api/samehadaku/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.animes || [];
  } catch (error) {
    console.error('Error searching animes:', error);
    return [];
  }
}
