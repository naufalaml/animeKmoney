import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Film, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Anime, TMDBGenre } from '../types';
import { getGenres, searchAnimes, getAnimes as fetchAnimes } from '../services/api';

interface CatalogProps {
  animes: Anime[];
  isLoading: boolean;
  onSelectAnime: (anime: Anime) => void;
  onAdImpression: () => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  animes,
  isLoading,
  onSelectAnime,
  onAdImpression,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [genres, setGenres] = useState<TMDBGenre[]>([]);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [genreAnimes, setGenreAnimes] = useState<Anime[]>([]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'title'>('popularity');
  const searchTimeout = useRef<any>(null);

  // Load genres from TMDB on mount
  useEffect(() => {
    async function loadGenres() {
      const tmdbGenres = await getGenres();
      setGenres(tmdbGenres);
    }
    loadGenres();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchAnimes(searchQuery.trim());
      setSearchResults(results);
      setIsSearching(false);
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  // Load animes by genre when genre filter changes
  const handleGenreSelect = useCallback(async (genreId: number | null) => {
    setSelectedGenreId(genreId);
    setCurrentPage(1);
    if (genreId === null) {
      setGenreAnimes([]);
      return;
    }
    setLoadingGenre(true);
    const result = await fetchAnimes(1, genreId);
    setGenreAnimes(result.animes);
    setTotalPages(result.totalPages);
    setLoadingGenre(false);
  }, []);

  // Pagination for genre filter
  const handlePageChange = useCallback(async (page: number) => {
    if (!selectedGenreId) return;
    setCurrentPage(page);
    setLoadingGenre(true);
    const result = await fetchAnimes(page, selectedGenreId);
    setGenreAnimes(result.animes);
    setTotalPages(result.totalPages);
    setLoadingGenre(false);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  }, [selectedGenreId]);

  const trendingAnimes = animes.filter(a => a.trending);

  // Auto slide featured anime carousel
  useEffect(() => {
    if (searchQuery || selectedGenreId || trendingAnimes.length <= 1) return;
    
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % trendingAnimes.length);
    }, 5000);
    
    return () => clearInterval(slideInterval);
  }, [trendingAnimes.length, searchQuery, selectedGenreId]);

  // Determine and sort animes to display
  const getSortedAnimes = () => {
    const baseList = searchQuery.trim().length >= 2
      ? searchResults
      : selectedGenreId
        ? genreAnimes
        : animes;

    return [...baseList].sort((a, b) => {
      if (sortBy === 'rating') {
        return b.voteAverage - a.voteAverage;
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return b.popularity - a.popularity;
    });
  };

  const displayAnimes = getSortedAnimes();

  const handleAnimeClick = (anime: Anime) => {
    onAdImpression();
    onSelectAnime(anime);
  };



  return (
    <div className="catalog-container">
      {/* Top Banner space cleared (ads removed) */}

      {/* Interactive Featured Hero Carousel */}
      {!isLoading && trendingAnimes.length > 0 && !searchQuery && !selectedGenreId && (
        <section className="hero-carousel-section">
          <div className="hero-carousel-container">
            {trendingAnimes.map((anime, index) => {
              const isFallback = anime.backdropUrl === anime.posterUrl || !anime.backdropUrl.includes('/w1280');
              return (
                <div
                  key={anime.id}
                  className={`hero-slide ${index === activeSlide ? 'active' : ''}`}
                  style={{
                    display: index === activeSlide ? 'block' : 'none',
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  {/* Background Layer with blur applied if no landscape backdrop found */}
                  <div
                    className="hero-slide-bg"
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundImage: `url(${anime.backdropUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: isFallback ? 'blur(28px) brightness(0.48)' : 'none',
                      transform: isFallback ? 'scale(1.1)' : 'none',
                      transition: 'filter 0.5s ease',
                      zIndex: 1
                    }}
                  />
                  
                  {/* Dark Gradient Overlay over Background Layer */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'linear-gradient(to right, rgba(5, 5, 8, 0.95) 25%, rgba(5, 5, 8, 0.65) 60%, transparent 100%)',
                      zIndex: 2
                    }}
                  />

                  <div className="hero-slide-content animate-slide-in" style={{ zIndex: 3 }}>
                    <span className="featured-badge">✨ REKOMENDASI TERPOPULER</span>
                    <h1 className="hero-title">{anime.title}</h1>
                    {anime.originalName && anime.originalName !== anime.title && (
                      <h2 className="hero-subtitle">{anime.originalName}</h2>
                    )}
                    <p className="hero-description">{anime.description}</p>
                    
                    <div className="hero-meta">
                      <span className="hero-meta-item rating">
                        <Star size={14} style={{ color: '#FFD700', fill: '#FFD700' }} />
                        {anime.voteAverage.toFixed(1)}
                      </span>
                      <span className="hero-meta-item">{anime.genre.split(',')[0]}</span>
                      <span className="hero-meta-item">{anime.firstAirDate ? anime.firstAirDate.split('-')[0] : '2024'}</span>
                    </div>
                    
                    <button
                      className="hero-watch-btn"
                      onClick={() => handleAnimeClick(anime)}
                    >
                      ▶ Nonton Sekarang
                    </button>
                  </div>

                  {/* Floating sharp vertical poster on the right when backdrop is not available */}
                  {isFallback && (
                    <div
                      className="hero-slide-poster-right animate-slide-in"
                      style={{
                        position: 'absolute',
                        top: '42%',
                        right: '8%',
                        transform: 'translateY(-50%)',
                        width: '190px',
                        height: '270px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 30px rgba(168, 85, 247, 0.35)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        zIndex: 3
                      }}
                    >
                      <img src={anime.posterUrl} alt={anime.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Carousel navigation controls */}
            {trendingAnimes.length > 1 && (
              <>
                <button
                  className="carousel-control prev"
                  onClick={() => setActiveSlide((prev) => (prev - 1 + trendingAnimes.length) % trendingAnimes.length)}
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className="carousel-control next"
                  onClick={() => setActiveSlide((prev) => (prev + 1) % trendingAnimes.length)}
                  aria-label="Next slide"
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* Dots indicators */}
                <div className="carousel-dots">
                  {trendingAnimes.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot ${index === activeSlide ? 'active' : ''}`}
                      onClick={() => setActiveSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-search-row">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Cari anime terpopuler... (contoh: Naruto, One Piece)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sorting Dropdown Menu */}
        <div className="sort-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>Urutkan:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-light)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '20px',
              outline: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <option value="popularity">🔥 Terpopuler</option>
            <option value="rating">⭐️ Rating Tertinggi</option>
            <option value="title">🔤 Nama (A-Z)</option>
          </select>
        </div>

        {/* Genre Select Dropdown Menu */}
        <div className="genre-select-box" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>Genre:</span>
          <select
            value={selectedGenreId || ''}
            onChange={(e) => {
              const val = e.target.value;
              handleGenreSelect(val ? parseInt(val) : null);
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--border-light)',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '20px',
              outline: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 10px rgba(168, 85, 247, 0.05)'
            }}
          >
            <option value="">📂 Semua Genre</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                🎭 {genre.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Results Indicator */}
      {searchQuery.trim().length >= 2 && (
        <div style={{ padding: '8px 0', fontSize: '14px', color: '#A0AAB2' }}>
          {isSearching ? (
            <span>🔍 Mencari "{searchQuery}"...</span>
          ) : (
            <span>
              Menampilkan {searchResults.length} hasil pencarian untuk "<strong style={{ color: '#FFD700' }}>{searchQuery}</strong>"
              {searchResults.length === 0 && ' — Coba kata kunci lain atau hapus filter.'}
            </span>
          )}
        </div>
      )}

      {/* Anime List Section */}
      <section className="drama-list-section">
        <h2 className="section-title">
          <Film className="icon-film" /> {searchQuery ? 'Hasil Pencarian' : selectedGenreId ? `Genre Anime - ${genres.find(g => g.id === selectedGenreId)?.name || ''}` : 'Jelajahi Anime Terpopuler'}
        </h2>

        {isLoading || loadingGenre ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner" style={{ borderColor: 'var(--accent-red) transparent transparent transparent' }}></div>
            <p>Memuat database Anime Jepang dari Samehadaku...</p>
          </div>
        ) : displayAnimes.length === 0 ? (
          <div className="no-results">
            <p>Anime tidak ditemukan. Coba kata kunci atau genre lain.</p>
          </div>
        ) : (
          <>
            <div className="drama-grid">
              {displayAnimes.map((anime) => (
                <div
                  key={anime.id}
                  className="drama-card"
                  onClick={() => handleAnimeClick(anime)}
                >
                  <div className="drama-card-img-container">
                    <img src={anime.posterUrl} alt={anime.title} className="drama-img" />
                    <span className="drama-badge" style={{ background: 'rgba(139, 92, 246, 0.85)' }}>{anime.duration}</span>
                    {/* Rating badge */}
                    <span style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      backdropFilter: 'blur(4px)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '11px',
                    }}>
                      <Star size={10} style={{ color: '#FFD700', fill: '#FFD700' }} />
                      <span style={{ color: '#FFD700', fontWeight: 600 }}>{anime.voteAverage.toFixed(1)}</span>
                    </span>
                  </div>
                  <div className="drama-info">
                    <h3>{anime.title}</h3>
                    {anime.originalName && anime.originalName !== anime.title && (
                      <span style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginTop: '-4px' }}>
                        {anime.originalName}
                      </span>
                    )}
                    <span className="drama-genre-label">{anime.genre.split(',')[0]}</span>
                    <p className="drama-desc-preview">{anime.description}</p>
                    <div className="drama-card-footer">
                      <span>{anime.firstAirDate ? anime.firstAirDate.split('-')[0] : ''}</span>
                      <button className="watch-now-btn" style={{ background: 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-pink) 100%)' }}>Nonton & Cuan</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for genre-filtered results */}
            {selectedGenreId && totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
                padding: '24px 0',
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  style={{
                    background: currentPage <= 1 ? 'rgba(255,255,255,0.03)' : 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    color: currentPage <= 1 ? '#555' : 'var(--text-main)',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span style={{ color: '#A0AAB2', fontSize: '14px' }}>
                  Halaman <strong style={{ color: '#A855F7' }}>{currentPage}</strong> dari {Math.min(totalPages, 500)}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  style={{
                    background: currentPage >= totalPages ? 'rgba(255,255,255,0.03)' : 'rgba(168,85,247,0.1)',
                    border: '1px solid rgba(168,85,247,0.2)',
                    color: currentPage >= totalPages ? '#555' : 'var(--text-main)',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Native Ad Space Cleared (ads removed) */}
    </div>
  );
};
export default Catalog;
