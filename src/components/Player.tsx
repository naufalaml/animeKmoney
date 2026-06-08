import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ShieldAlert, Award, AlertCircle, Coins, Play, Star, Loader, Server, Minimize2, Maximize2, Expand } from 'lucide-react';
import type { Anime, User, Episode, Season } from '../types';
import { getAnimeDetails, getSeasonEpisodes, getImageUrl } from '../services/api';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

interface PlayerProps {
  anime: Anime;
  currentUser: User | null;
  onBack: () => void;
  onAwardCoins: (coins: number, milestoneLabel: string, secondsWatched: number) => void;
  onAdImpression: () => void;
  initialEpisode?: number;
}

interface Milestone {
  timeSeconds: number;
  totalCoins: number;
  addedCoins: number;
  label: string;
}

const getBypassVideoId = (epNum: number): string => {
  const ids = [
    'TAlKhARUcoY', // Genshin Impact Official Promo
    '1T2gA-qS448', // Honkai: Star Rail Trailer
    'k021Wk49-Kk', // Demon Slayer Promo
    'gXU7z3Sca38'  // Honkai Impact 3rd AMV / Trailer
  ];
  return ids[(epNum - 1) % ids.length];
};

export const Player: React.FC<PlayerProps> = ({
  anime,
  currentUser,
  onBack,
  onAwardCoins,
  onAdImpression,
  initialEpisode,
}) => {
  const [isWatching, setIsWatching] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [isTabActive, setIsTabActive] = useState(true);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode || 1);
  const [showMilestoneAlert, setShowMilestoneAlert] = useState<{show: boolean; coins: number; label: string} | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [animeDetails, setAnimeDetails] = useState<Partial<Anime> | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [currentServerName, setCurrentServerName] = useState('Default Server');
  const [availableServers, setAvailableServers] = useState<{name: string, src: string}[]>([]);
  const [activeStreamUrl, setActiveStreamUrl] = useState('');
  const [isAdBlockActive, setIsAdBlockActive] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // Sync browser URL with the active anime and episode
  useEffect(() => {
    if (anime && anime.id) {
      const epPath = `/${anime.id}/episode-${currentEpisode}`;
      if (window.location.pathname !== epPath) {
        window.history.pushState({ animeId: anime.id, episode: currentEpisode }, '', epPath);
      }
    }
  }, [anime.id, currentEpisode]);
  const playerRef = useRef<any>(null);

  // Milestones: 1000 koin = 100 rupiah -> 1 koin = 0.1 rupiah
  const milestones: Milestone[] = [
    { timeSeconds: 30, totalCoins: 70, addedCoins: 70, label: '30 Detik' },
    { timeSeconds: 120, totalCoins: 190, addedCoins: 120, label: '2 Menit' },
    { timeSeconds: 300, totalCoins: 350, addedCoins: 160, label: '5 Menit' },
    { timeSeconds: 600, totalCoins: 500, addedCoins: 150, label: '10 Menit' },
    { timeSeconds: 1800, totalCoins: 900, addedCoins: 400, label: '30 Menit' },
    { timeSeconds: 3600, totalCoins: 1200, addedCoins: 300, label: '1 Jam' },
    { timeSeconds: 7200, totalCoins: 1800, addedCoins: 600, label: '2 Jam (Maks)' }
  ];

  // Load anime details and initial episodes
  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      const details = await getAnimeDetails(anime.id);
      if (cancelled) return;
      if (details) {
        setAnimeDetails(details);
        const validSeasons = (details.seasons || []).filter((s: Season) => s.seasonNumber > 0);
        setSeasons(validSeasons);

        // Load first valid season episodes
        if (validSeasons.length > 0) {
          const firstSeason = validSeasons[0].seasonNumber;
          setCurrentSeason(firstSeason);
          await loadEpisodes(anime.id, firstSeason, cancelled);
        }
      }
    }

    loadDetails();
    return () => { cancelled = true; };
  }, [anime.id]);

  const loadEpisodes = useCallback(async (tmdbId: number | string, seasonNum: number, cancelled?: boolean) => {
    setLoadingEpisodes(true);
    const eps = await getSeasonEpisodes(tmdbId, seasonNum);
    if (cancelled) return;
    setEpisodes(eps);
    setLoadingEpisodes(false);
    if (eps.length > 0) {
      setCurrentEpisode(eps[0].number);
    }
  }, []);

  // Load YouTube Iframe Player API script dynamically
  useEffect(() => {
    if (currentServerName === 'Bypass Server (YouTube)') {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, [currentServerName]);

  // Initialize YouTube Player
  useEffect(() => {
    let player: any = null;
    let checkInterval: any = null;

    if (currentServerName === 'Bypass Server (YouTube)') {
      setIframeLoading(true);
      const initPlayer = () => {
        const container = document.getElementById('youtube-player');
        if (!container) return;

        // Clean container and create active target div
        container.innerHTML = '';
        const innerDiv = document.createElement('div');
        innerDiv.id = 'yt-player-inner';
        container.appendChild(innerDiv);

        const videoId = getBypassVideoId(currentEpisode);
        player = new window.YT.Player('yt-player-inner', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: isWatching ? 1 : 0,
            controls: 1,
            rel: 0,
            showinfo: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              setIframeLoading(false);
              if (isWatching) {
                player.playVideo();
              }
            },
            onStateChange: (event: any) => {
              if (event.data === 0) { // ENDED (0)
                setVideoEnded(true);
                setIsWatching(false);
              } else if (event.data === 1) { // PLAYING (1)
                setIsWatching(true);
                setVideoEnded(false);
              } else if (event.data === 2) { // PAUSED (2)
                setIsWatching(false);
              }
            }
          }
        });
        playerRef.current = player;
      };

      const checkYTLoaded = () => {
        if (window.YT && window.YT.Player) {
          initPlayer();
          if (checkInterval) clearInterval(checkInterval);
        }
      };

      if (window.YT && window.YT.Player) {
        initPlayer();
      } else {
        checkInterval = setInterval(checkYTLoaded, 100);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (e) {
          console.error('Error destroying YT player:', e);
        }
      }
      playerRef.current = null;
    };
  }, [currentEpisode, currentServerName]);

  const activeEpisode = episodes.find(e => e.number === currentEpisode);

  // Load stream servers for the active episode dynamically from Samehadaku
  useEffect(() => {
    if (currentServerName === 'Bypass Server (YouTube)') {
      setIframeLoading(false);
      setActiveStreamUrl('bypass');
      return;
    }

    if (!activeEpisode || !activeEpisode.url) {
      setAvailableServers([]);
      setActiveStreamUrl('');
      return;
    }

    let cancelled = false;

    async function loadStreams() {
      setIframeLoading(true);
      try {
        const response = await fetch(`/api/samehadaku/episode?url=${encodeURIComponent(activeEpisode?.url || '')}`);
        const data = await response.json();
        
        if (cancelled) return;
        
        const servers = data.servers || [];
        setAvailableServers(servers);
        
        if (servers.length > 0) {
          const existingServer = servers.find((s: any) => s.name === currentServerName);
          if (existingServer) {
            setActiveStreamUrl(existingServer.src);
          } else {
            setCurrentServerName(servers[0].name);
            setActiveStreamUrl(servers[0].src);
          }
        } else {
          setActiveStreamUrl('');
        }
      } catch (err) {
        console.error('Error fetching stream servers:', err);
        if (!cancelled) {
          setAvailableServers([]);
          setActiveStreamUrl('');
        }
      } finally {
        if (!cancelled) {
          setIframeLoading(false);
        }
      }
    }

    loadStreams();
    return () => { cancelled = true; };
  }, [currentEpisode, activeEpisode, currentServerName]);

  // Monitor Page Visibility for Anti-Cheat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabActive(false);
        // Anti-Cheat: physically pause video when user navigates away
        if (currentServerName === 'Bypass Server (YouTube)' && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      } else {
        setIsTabActive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentServerName]);

  // Timer running when user is watching and tab is active
  useEffect(() => {
    let interval: any = null;

    if (isWatching && isTabActive && currentUser) {
      interval = setInterval(() => {
        setSecondsWatched((prev) => {
          const nextSeconds = prev + 1;

          // Check if a milestone was reached
          const reachedMilestone = milestones.find(m => m.timeSeconds === nextSeconds);
          if (reachedMilestone) {
            onAwardCoins(reachedMilestone.addedCoins, reachedMilestone.label, nextSeconds);

            // Show custom milestone celebration
            setShowMilestoneAlert({
              show: true,
              coins: reachedMilestone.addedCoins,
              label: reachedMilestone.label
            });

            // Auto hide celebration after 5 seconds
            setTimeout(() => {
              setShowMilestoneAlert(null);
            }, 5000);
          }

          return nextSeconds;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, isTabActive, currentUser]);

  const handleStartWatching = () => {
    if (!currentUser) {
      return; // Silently skip if not logged in, coin timer won't run
    }
    setIsWatching(true);
    if (currentServerName === 'Bypass Server (YouTube)' && playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
  };

  const handleStopWatching = () => {
    setIsWatching(false);
    if (currentServerName === 'Bypass Server (YouTube)' && playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
  };

  // Toggle fullscreen for the video player container
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleSeasonChange = async (seasonNum: number) => {
    setCurrentSeason(seasonNum);
    setIframeLoading(true);
    setVideoEnded(false);
    await loadEpisodes(anime.id, seasonNum);
    onAdImpression();
  };

  const handleEpisodeChange = (epNum: number) => {
    setCurrentEpisode(epNum);
    setIframeLoading(true);
    setVideoEnded(false);
    onAdImpression();
  };

  // Find next milestone
  const nextMilestone = milestones.find(m => m.timeSeconds > secondsWatched) || milestones[milestones.length - 1];
  const prevMilestoneTime = milestones.filter(m => m.timeSeconds < nextMilestone.timeSeconds).slice(-1)[0]?.timeSeconds || 0;

  // Calculate progress percent to next milestone
  const progressToNext = ((secondsWatched - prevMilestoneTime) / (nextMilestone.timeSeconds - prevMilestoneTime)) * 100;

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + 'j ' : ''}${minutes}m ${seconds}s`;
  };

  // Display info
  const displayDescription = animeDetails?.description || anime.description;
  const displayGenre = animeDetails?.genre || anime.genre;
  const displayEpisodeCount = animeDetails?.episodes || anime.episodes;
  const displayDuration = animeDetails?.duration || anime.duration;
  const displayYear = anime.firstAirDate ? anime.firstAirDate.split('-')[0] : '2024';

  // Current active episode details (declared above)

  return (
    <div className="player-container">
      {/* Back button */}
      <button className="back-btn" onClick={onBack}>
        <ArrowLeft size={18} /> Kembali ke Katalog Anime
      </button>

      {/* Main Video Layout */}
      <div className="video-section">
        <div
          ref={playerContainerRef}
          className={`video-player-container-ambient ${isMinimized ? 'minimized' : ''} ${isFullscreen ? 'fullscreen-mode' : ''}`}
          style={{ position: 'relative', width: '100%' }}
        >
          {/* Dynamic Ambient Glow backdrop behind player */}
          <div 
            className={`video-player-ambient-glow ${isWatching ? 'active' : ''}`}
            style={{
              position: 'absolute',
              top: '-4%',
              left: '-4%',
              width: '108%',
              height: '108%',
              backgroundImage: currentServerName === 'Bypass Server (YouTube)' ? 'none' : `url(${anime.posterUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(80px) saturate(1.5)',
              opacity: isWatching ? 0.38 : 0,
              transition: 'opacity 1s ease',
              zIndex: 0,
              pointerEvents: 'none',
              borderRadius: '24px'
            }}
          />

          {/* Player Control Buttons: Minimize / Maximize / Fullscreen */}
          <div className="player-control-bar">
            <button
              className="player-ctrl-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Perbesar Player' : 'Perkecil Player'}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              <span>{isMinimized ? 'Perbesar' : 'Perkecil'}</span>
            </button>
            <button
              className="player-ctrl-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}
            >
              <Expand size={16} />
              <span>{isFullscreen ? 'Keluar Fullscreen' : 'Fullscreen'}</span>
            </button>

            {/* Coin timer status indicator */}
            {currentUser && (
              <span className="player-coin-status">
                <span className={`coin-dot ${isWatching ? 'active' : ''}`} />
                {isWatching ? `Koin mengalir • ${formatTime(secondsWatched)}` : 'Putar video untuk mulai cuan'}
              </span>
            )}
          </div>

          <div className="video-player-wrapper" style={{ position: 'relative', zIndex: 1 }}>
            {/* Iframe Embed or YouTube Player */}
          {currentServerName === 'Bypass Server (YouTube)' ? (
            <div
              id="youtube-player"
              className="main-video-iframe"
              style={{
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                background: 'black',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            />
          ) : (
            <iframe
              key={`${anime.id}-${currentEpisode}-${activeStreamUrl}-${isAdBlockActive}`}
              src={activeStreamUrl}
              className="main-video-iframe"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="origin"
              sandbox={isAdBlockActive ? "allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation" : undefined}
              onLoad={() => {
                setIframeLoading(false);
                // Auto-start coin timer when iframe video loads
                if (currentUser && !isWatching) {
                  setIsWatching(true);
                }
              }}
            />
          )}

          {/* Loading overlay */}
          {iframeLoading && (
            <div className="iframe-loading-overlay" style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(11, 11, 14, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 8,
              gap: '12px'
            }}>
              <Loader size={36} style={{ animation: 'spin 1s infinite linear', color: 'var(--accent-red)' }} />
              <p style={{ color: '#A0AAB2', fontSize: '14px' }}>Memuat streaming...</p>
            </div>
          )}

          {/* Episode Ended Overlay */}
          {videoEnded && currentServerName === 'Bypass Server (YouTube)' && (
            <div className="iframe-loading-overlay" style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(11, 11, 14, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9,
              gap: '16px'
            }}>
              <Award size={48} style={{ color: '#FFD700', animation: 'pulse 1.5s infinite' }} />
              <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: 700 }}>Episode {currentEpisode} Selesai! 🧧</h3>
              <p style={{ color: '#A0AAB2', fontSize: '14px', margin: 0 }}>Koin menonton Anda telah berhasil diakumulasikan.</p>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setVideoEnded(false);
                    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
                      playerRef.current.seekTo(0);
                      playerRef.current.playVideo();
                    }
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Putar Ulang
                </button>

                {currentEpisode < (episodes.length || anime.episodes || 1) && (
                  <button
                    onClick={() => {
                      setVideoEnded(false);
                      handleEpisodeChange(currentEpisode + 1);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-pink) 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
                    }}
                  >
                    Episode Berikutnya ➔
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Custom title overlay */}
          <div className="video-title-overlay" style={{ pointerEvents: 'none' }}>
            <div className="video-overlay-title">
              {anime.title} - S{currentSeason}E{currentEpisode}
            </div>
          </div>

          {/* Visibility Warning (Anti-Cheat) */}
          {!isTabActive && (
            <div className="anti-cheat-overlay">
              <ShieldAlert size={48} className="text-red-500 animate-bounce" />
              <h3>ANTI-CHEAT AKTIF</h3>
              <p>Waktu menonton dihentikan karena Anda keluar dari tab aplikasi.</p>
              <p className="subtext">Kembalilah ke halaman ini untuk lanjut menonton dan mendapatkan koin.</p>
            </div>
          )}

          {/* Milestone Notification Toast */}
          {showMilestoneAlert && (
            <div className="milestone-alert-toast animate-slide-in">
              <Award size={24} className="toast-icon text-yellow-400" />
              <div className="toast-body">
                <h4>Milestone {showMilestoneAlert.label} Tercapai!</h4>
                <p>Mendapatkan <strong>+{showMilestoneAlert.coins} Koin</strong> (≈ Rp {Math.floor(showMilestoneAlert.coins * 0.1)})</p>
              </div>
            </div>
          )}
        </div>
      </div>


        {/* Next Episode Button (compact) */}
        {currentUser && currentEpisode < (episodes.length || anime.episodes || 1) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={() => {
                setVideoEnded(false);
                handleEpisodeChange(currentEpisode + 1);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: 'var(--text-main)',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            >
              Episode Selanjutnya ➔
            </button>
          </div>
        )}

        {/* Server Selector */}
        <div style={{
          marginTop: '16px',
          background: 'var(--bg-surface)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '10px',
          padding: '12px 16px',
          border: '1px solid var(--border-light)'
        }}>
          {/* AdBlocker Toggle inside the Server Selector box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-light)'
          }}>
            <span style={{ fontSize: '13px', color: '#FFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              🛡️ Anti-Iklan (Ad-Blocker)
            </span>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '44px',
              height: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isAdBlockActive}
                onChange={(e) => {
                  setIsAdBlockActive(e.target.checked);
                  setIframeLoading(true);
                }}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: isAdBlockActive ? 'var(--accent-red)' : 'rgba(255,255,255,0.2)',
                borderRadius: '34px',
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '18px',
                  width: '18px',
                  left: isAdBlockActive ? '22px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'black',
                  borderRadius: '50%',
                  transition: '0.3s',
                }}></span>
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Server size={16} style={{ color: 'var(--accent-red)' }} />
            <h4 style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: 600 }}>Pilih Server Streaming</h4>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#A0AAB2', lineHeight: '1.4' }}>
            {isAdBlockActive 
              ? 'Status: Anti-Iklan Aktif. Beberapa server mungkin menolak memutar video. Jika video tidak berputar, silakan matikan tombol Anti-Iklan di atas atau ganti server.' 
              : 'Status: Mode Lancar. Pembatasan browser dinonaktifkan, video dijamin berputar tetapi iklan bawaan mungkin muncul.'}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableServers.map((server) => (
              <button
                key={server.name}
                onClick={() => {
                  setCurrentServerName(server.name);
                  setActiveStreamUrl(server.src);
                  setIframeLoading(true);
                  onAdImpression();
                }}
                style={{
                  background: currentServerName === server.name
                    ? 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-pink) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: currentServerName === server.name
                    ? 'none'
                    : '1px solid var(--border-light)',
                  color: currentServerName === server.name ? 'white' : '#A0AAB2',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {server.name}
              </button>
            ))}
            
            <button
              key="bypass_server"
              onClick={() => {
                setCurrentServerName('Bypass Server (YouTube)');
                setActiveStreamUrl('bypass');
                setIframeLoading(false);
                onAdImpression();
              }}
              style={{
                background: currentServerName === 'Bypass Server (YouTube)'
                  ? 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-pink) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: currentServerName === 'Bypass Server (YouTube)'
                  ? 'none'
                  : '1px solid var(--border-light)',
                color: currentServerName === 'Bypass Server (YouTube)' ? 'white' : '#A0AAB2',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ⚡ Server Cadangan (Demo Trailer & Bypass)
            </button>
          </div>

          {/* ISP DNS Block Warning */}
          <div style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-light)',
            fontSize: '12px',
            color: '#FFA500',
            lineHeight: '1.5',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
              ⚠️ <strong>PENTING:</strong> Jika muncul tulisan <em>"server IP address could not be found"</em> atau blank, itu tandanya domain streaming diblokir oleh provider internet Anda (Internet Positif / IndiHome / Telkomsel / XL / dll).
            </span>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: '#4AD66D' }}>
              💡 <strong>Solusi Cepat (10 Detik Tanpa Install):</strong>
            </span>
            <ol style={{ margin: '0 0 0 20px', padding: 0, color: '#E0E6ED' }}>
              <li>Buku Pengaturan Chrome (Settings).</li>
              <li>Ketik <strong>"Secure DNS"</strong> di kolom pencarian settings Chrome.</li>
              <li>Cari menu <strong>Use secure DNS</strong> (Gunakan DNS aman).</li>
              <li>Pilih opsi <strong>"With"</strong> (Dengan) dan ubah pilihan menjadi <strong>Cloudflare (1.1.1.1)</strong> atau <strong>Google (Public DNS)</strong>.</li>
              <li>Kembali ke halaman ini dan segarkan / <strong>refresh halaman web</strong>!</li>
            </ol>
          </div>
        </div>

        {/* Video Info Cards */}
        <div className="video-info-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
          <div className="title-row">
            <div>
              <h1>{anime.title}</h1>
              {anime.originalName && anime.originalName !== anime.title && (
                <p style={{ fontSize: '14px', color: '#A0AAB2', marginTop: '4px', fontStyle: 'italic' }}>
                  {anime.originalName}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={16} style={{ color: '#FFD700', fill: '#FFD700' }} />
                <span style={{ color: '#FFD700', fontWeight: 700, fontSize: '15px' }}>
                  {anime.voteAverage.toFixed(1)}
                </span>
              </div>
              <span className="genre-tag" style={{ border: '1px solid var(--border-light)' }}>{displayGenre}</span>
            </div>
          </div>
          <div className="meta-row">
            <span>Rilis: {displayYear}</span>
            <span>•</span>
            <span>Total: {displayEpisodeCount} Episode</span>
            <span>•</span>
            <span>Durasi: {displayDuration} per episode</span>
            {seasons.length > 0 && (
              <>
                <span>•</span>
                <span>{seasons.length} Season</span>
              </>
            )}
          </div>
          <p className="description-text">{displayDescription}</p>

          {/* Season Selector */}
          {seasons.length > 1 && (
            <div className="episode-selector-section" style={{ marginBottom: '20px' }}>
              <h3>Pilih Season</h3>
              <div className="episode-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                {seasons.map((season) => (
                  <button
                    key={season.id}
                    className={`episode-btn ${currentSeason === season.seasonNumber ? 'active' : ''}`}
                    onClick={() => handleSeasonChange(season.seasonNumber)}
                    title={season.name}
                    style={{
                      borderColor: currentSeason === season.seasonNumber ? 'var(--accent-red)' : 'var(--border-light)',
                      background: currentSeason === season.seasonNumber ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)'
                    }}
                  >
                    {season.name}
                    <span style={{ display: 'block', fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                      {season.episodeCount} Eps
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Episode Selectors */}
          <div className="episode-selector-section">
            <h3>Pilih Episode {seasons.length > 1 ? `- ${seasons.find(s => s.seasonNumber === currentSeason)?.name || ''}` : ''}</h3>

            {loadingEpisodes ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0', color: '#A0AAB2' }}>
                <Loader size={18} style={{ animation: 'spin 1s infinite linear' }} />
                <span>Memuat daftar episode...</span>
              </div>
            ) : (
              <div className="episode-grid">
                {episodes.length > 0 ? (
                  episodes.map((ep) => (
                    <button
                      key={ep.id}
                      className={`episode-btn ${currentEpisode === ep.number ? 'active' : ''}`}
                      onClick={() => handleEpisodeChange(ep.number)}
                      title={ep.name}
                      style={{
                        borderColor: currentEpisode === ep.number ? 'var(--accent-red)' : 'var(--border-light)',
                        background: currentEpisode === ep.number ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      Eps {ep.number}
                    </button>
                  ))
                ) : (
                  Array.from({ length: Math.max(anime.episodes, 1) }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`episode-btn ${currentEpisode === i + 1 ? 'active' : ''}`}
                      onClick={() => handleEpisodeChange(i + 1)}
                      style={{
                        borderColor: currentEpisode === i + 1 ? 'var(--accent-red)' : 'var(--border-light)',
                        background: currentEpisode === i + 1 ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      Eps {i + 1}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Display active episode details */}
            {activeEpisode && (
              <div className="active-episode-details" style={{ marginTop: '16px', padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ color: 'var(--accent-pink)', marginBottom: '0' }}>
                    Episode {activeEpisode.number}: {activeEpisode.name}
                  </h4>
                  {activeEpisode.voteAverage > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#FFD700' }}>
                      <Star size={12} style={{ fill: '#FFD700' }} />
                      {activeEpisode.voteAverage.toFixed(1)}
                    </span>
                  )}
                </div>
                {activeEpisode.airDate && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Tayang: {new Date(activeEpisode.airDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {activeEpisode.overview || 'Tidak ada ringkasan untuk episode ini.'}
                </p>
                {activeEpisode.stillPath && (
                  <img
                    src={getImageUrl(activeEpisode.stillPath, 'w300')}
                    alt={activeEpisode.name}
                    style={{ marginTop: '10px', borderRadius: '6px', width: '100%', maxWidth: '300px', opacity: 0.85 }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar: Earnings Monitor */}
      <div className="earning-monitor-sidebar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
          <Coins className="text-yellow-400" size={20} />
          <h2>Earnings Monitor</h2>
        </div>

        {!currentUser ? (
          <div className="login-prompt">
            <AlertCircle className="text-red-400" size={36} />
            <p>Anda belum masuk ke akun Anda.</p>
            <p className="subtext">Silakan login di menu Dashboard terlebih dahulu agar durasi menonton Anda dapat ditukarkan menjadi koin.</p>
          </div>
        ) : (
          <div className="monitor-stats">
            {/* Watching Status */}
            <div className="stat-box" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <span className="stat-label">Status Timer</span>
              <span className="stat-val" style={{ color: isWatching ? '#4AD66D' : '#FFA500', fontSize: '13px' }}>
                {isWatching ? '🟢 Timer Aktif - Koin Mengalir!' : '🟡 Putar Video untuk Mulai'}
              </span>
            </div>

            {/* Watch Time Counter */}
            <div className="stat-box" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <span className="stat-label">Waktu Tonton Sesi Ini</span>
              <span className="stat-val text-green-400">{formatTime(secondsWatched)}</span>
            </div>

            {/* Anti-cheat status */}
            <div className="stat-box" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <span className="stat-label">Status Detektor</span>
              <span className="stat-val flex items-center gap-1 text-xs">
                <span className={`status-dot ${isTabActive ? 'green' : 'red'}`}></span>
                {isTabActive ? 'Pengguna Aktif (Koin Mengalir)' : 'Terdeteksi Tidak Aktif'}
              </span>
            </div>

            {/* Next Milestone Progress */}
            <div className="milestone-progress-box" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <div className="milestone-text-row">
                <span>Target: <strong>{nextMilestone.label}</strong></span>
                <span>{formatTime(secondsWatched)} / {formatTime(nextMilestone.timeSeconds)}</span>
              </div>

              {/* Progress Bar */}
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(progressToNext, 100)}%`, background: 'linear-gradient(90deg, var(--accent-red) 0%, var(--accent-pink) 100%)' }}
                ></div>
              </div>

              <div className="reward-hint">
                Hadiah: <strong>+{nextMilestone.addedCoins} Koin</strong> (Rp {Math.floor(nextMilestone.addedCoins * 0.1)})
              </div>
            </div>

            {/* Total Balance Snapshot */}
            <div className="balance-snapshot" style={{ marginBottom: '16px' }}>
              <span className="stat-label">Total Saldo Koin Anda</span>
              <span className="coins-total">{currentUser.coins.toLocaleString('id-ID')} Koin</span>
              <span className="cash-total">≈ Rp {Math.floor(currentUser.coins * 0.1).toLocaleString('id-ID')}</span>
            </div>

            {/* Achievements Checklist (Modern & Interactive) */}
            <div className="achievements-checklist-container" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '14px', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                🏆 Pencapaian Menonton
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {milestones.map((milestone) => {
                  const isUnlocked = secondsWatched >= milestone.timeSeconds;
                  return (
                    <div
                      key={milestone.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: isUnlocked ? 'rgba(74, 214, 109, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                        border: isUnlocked ? '1px solid rgba(74, 214, 109, 0.3)' : '1px solid var(--border-light)',
                        borderRadius: '8px',
                        boxShadow: isUnlocked ? '0 0 10px rgba(74, 214, 109, 0.1)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isUnlocked ? '#4AD66D' : 'rgba(255,255,255,0.05)',
                          border: isUnlocked ? 'none' : '1px dashed rgba(255,255,255,0.2)',
                          fontSize: '10px',
                          color: 'black',
                          fontWeight: 800
                        }}>
                          {isUnlocked ? '✓' : ''}
                        </span>
                        <span style={{ fontSize: '13px', color: isUnlocked ? 'white' : 'var(--text-muted)', fontWeight: isUnlocked ? 700 : 500 }}>
                          Target {milestone.label}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: isUnlocked ? '#4AD66D' : 'var(--accent-gold)', fontWeight: 700 }}>
                        +{milestone.addedCoins} Koin
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Player;
