import React from 'react';
import { Tv, Coins, User as UserIcon, Settings, Award } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  activeTab: 'catalog' | 'dashboard' | 'admin';
  setActiveTab: (tab: 'catalog' | 'dashboard' | 'admin') => void;
  currentUser: User | null;
  onOpenSponsorAd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenSponsorAd,
}) => {
  // 1,000 coins = 100 Rupiah -> 1 coin = 0.1 Rupiah
  const coinsToRupiah = (coins: number) => {
    return Math.floor(coins * 0.1).toLocaleString('id-ID');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Brand Logo */}
        <div className="nav-logo" onClick={() => setActiveTab('catalog')}>
          <Tv className="logo-icon" style={{ color: 'var(--accent-red)' }} />
          <span>Anime<span className="accent">Cuan</span></span>
        </div>

        {/* Navigation Items */}
        <div className="nav-links">
          <button 
            className={`nav-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Beranda
          </button>
          
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard Akun
          </button>

          <button 
            className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Settings size={16} /> Owner Portal
          </button>
        </div>

        {/* User Balance & Actions */}
        <div className="nav-user-area">
          {currentUser ? (
            <div className="user-status-card">
              {/* Earn Bonus Button */}
              <button className="bonus-ad-btn" onClick={onOpenSponsorAd}>
                <Award size={16} className="shake-animation" />
                <span>Bonus +500 Koin</span>
              </button>

              {/* Coin Balance */}
              <div className="coin-display" onClick={() => setActiveTab('dashboard')}>
                <Coins className="coin-icon" />
                <span className="coin-count">{currentUser.coins.toLocaleString('id-ID')} koin</span>
                <span className="cash-val">≈ Rp {coinsToRupiah(currentUser.coins)}</span>
              </div>

              {/* User Profile Shortcut */}
              <div className="user-profile-tag" onClick={() => setActiveTab('dashboard')}>
                <UserIcon size={16} />
                <span className="username-label">{currentUser.username}</span>
              </div>
            </div>
          ) : (
            <button className="nav-login-btn" onClick={() => setActiveTab('dashboard')}>
              Mulai Nonton & Cuan
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
