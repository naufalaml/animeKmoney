export interface WithdrawalRequest {
  id: string;
  username: string;
  amount: number;
  coins: number;
  paymentMethod: 'DANA' | 'OVO' | 'GoPay' | 'Transfer Bank';
  accountDetails: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

export interface WatchSession {
  animeId: number | string;
  animeTitle: string;
  durationSeconds: number;
  coinsEarned: number;
  date: string;
}

export interface User {
  username: string;
  coins: number;
  totalEarnedCoins: number;
  watchTimeSeconds: number;
  lastEarnedTimestamp: number;
  withdrawals: WithdrawalRequest[];
  watchSessions: WatchSession[];
}

export interface Episode {
  id: number | string;
  name: string;
  number: number;
  season: number;
  seasonNumber: number;
  airDate: string | null;
  overview: string | null;
  stillPath: string | null;
  voteAverage: number;
  url?: string;
}

export interface Season {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  overview: string;
  posterPath: string | null;
  airDate: string | null;
}

export interface Anime {
  id: number | string;
  title: string;
  originalName: string;
  posterUrl: string;
  backdropUrl: string;
  description: string;
  genre: string;
  genreIds: number[];
  episodes: number;
  episodesList?: Episode[];
  seasons: Season[];
  voteAverage: number;
  firstAirDate: string;
  popularity: number;
  duration: string;
  trending?: boolean;
  originCountry: string[];
  url?: string;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface AdAnalytics {
  impressions: number;
  ctr: number;
  cpm: number;
  earningsUsd: number;
}
