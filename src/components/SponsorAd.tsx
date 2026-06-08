import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertCircle, X } from 'lucide-react';

interface SponsorAdProps {
  onClose: () => void;
  onReward: (coins: number) => void;
}

export const SponsorAd: React.FC<SponsorAdProps> = ({ onClose, onReward }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      setAdProgress((prev) => prev + (100 / 15));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleClaim = () => {
    onReward(500); // Give 500 coins reward
    onClose();
  };

  return (
    <div className="ad-overlay">
      <div className="ad-modal" style={{ border: '1px solid var(--accent-pink)' }}>
        <div className="ad-header">
          <div className="ad-badge" style={{ background: 'linear-gradient(135deg, var(--accent-red) 0%, var(--accent-pink) 100%)', color: 'white' }}>
            MISI HARIAN
          </div>
          {!isFinished ? (
            <span className="ad-warning text-xs flex items-center gap-1" style={{ color: 'var(--accent-pink)' }}>
              <AlertCircle size={14} /> Jangan tutup video quest ini untuk mendapatkan koin
            </span>
          ) : (
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className="ad-video-container">
          {/* Simulated Premium Quest Video Content */}
          <div className="ad-video-mock" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, #050508 100%)' }}>
            <div className="ad-video-content">
              <Play className="ad-play-icon animate-pulse" size={48} style={{ color: 'var(--accent-pink)' }} />
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>Dukung Platform AnimeCuan Terus Berkembang!</h3>
              <p style={{ color: 'var(--text-muted)' }}>Misi harian menonton video preview anime terbaru. Dapatkan koin bonus gratis setiap harinya.</p>
              <div className="ad-cpm-tag" style={{ color: 'var(--accent-pink)' }}>Misi Video Harian #1</div>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="ad-progress-bar-container">
              <div 
                className="ad-progress-bar" 
                style={{ width: `${Math.min(adProgress, 100)}%`, background: 'linear-gradient(90deg, var(--accent-red) 0%, var(--accent-pink) 100%)' }}
              ></div>
            </div>
          </div>
        </div>

        <div className="ad-footer">
          {!isFinished ? (
            <div className="ad-timer">
              Menonton video quest: <strong>{timeLeft} detik tersisa...</strong>
            </div>
          ) : (
            <div className="ad-claim-section">
              <span className="reward-text text-green-400 flex items-center gap-2" style={{ color: '#4AD66D' }}>
                <CheckCircle size={20} /> Selamat! Anda menyelesaikan Misi Harian!
              </span>
              <button className="claim-btn" onClick={handleClaim}>
                Klaim 500 Koin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default SponsorAd;
