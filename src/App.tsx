import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Catalog from './components/Catalog';
import Player from './components/Player';
import Dashboard from './components/Dashboard';
import AdminPortal from './components/AdminPortal';
import SponsorAd from './components/SponsorAd';
import { getAnimes } from './services/api';
import type { Anime, User, WithdrawalRequest, AdAnalytics } from './types';
import './App.css';

export function App() {
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'dashboard' | 'admin'>('catalog');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  // Navigate back to home and reset URL
  const navigateHome = () => {
    setSelectedAnime(null);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
  };
  
  // Persistence states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [adAnalytics, setAdAnalytics] = useState<AdAnalytics>({
    impressions: 12450,
    ctr: 2.34,
    cpm: 4.50,
    earningsUsd: 56.03,
  });

  const [showSponsorAd, setShowSponsorAd] = useState(false);

  // Load animes and sync with LocalStorage
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const result = await getAnimes();
      setAnimes(result.animes);
      setIsLoading(false);
    }
    loadData();

    // Restore user session
    const savedUser = localStorage.getItem('dc_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Restore withdrawals
    const savedWithdrawals = localStorage.getItem('dc_withdrawals');
    if (savedWithdrawals) {
      setAllWithdrawals(JSON.parse(savedWithdrawals));
    } else {
      // Seed initial mock withdrawals for testing admin dashboard
      const seedWithdrawals: WithdrawalRequest[] = [
        {
          id: 'w-1',
          username: 'otaku_lover',
          amount: 50000,
          coins: 500000,
          paymentMethod: 'DANA',
          accountDetails: 'Budi Santoso (081234567890)',
          status: 'Pending',
          date: '08/06/2026 10:20'
        },
        {
          id: 'w-2',
          username: 'sultan_anime',
          amount: 100000,
          coins: 1000000,
          paymentMethod: 'GoPay',
          accountDetails: 'Rian Wijaya (089876543210)',
          status: 'Approved',
          date: '07/06/2026 15:45'
        }
      ];
      setAllWithdrawals(seedWithdrawals);
      localStorage.setItem('dc_withdrawals', JSON.stringify(seedWithdrawals));
    }

    // Restore Ad Analytics
    const savedAnalytics = localStorage.getItem('dc_ad_analytics');
    if (savedAnalytics) {
      setAdAnalytics(JSON.parse(savedAnalytics));
    }
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // If URL is '/' or empty, go back to catalog
      if (window.location.pathname === '/' || window.location.pathname === '') {
        setSelectedAnime(null);
        setActiveTab('catalog');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save current user to LocalStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dc_current_user', JSON.stringify(currentUser));
      
      // Update this user's details in all users registry
      const allUsers = JSON.parse(localStorage.getItem('dc_users_registry') || '{}');
      allUsers[currentUser.username.toLowerCase()] = currentUser;
      localStorage.setItem('dc_users_registry', JSON.stringify(allUsers));
    } else {
      localStorage.removeItem('dc_current_user');
    }
  }, [currentUser]);

  // Save withdrawals
  useEffect(() => {
    localStorage.setItem('dc_withdrawals', JSON.stringify(allWithdrawals));
  }, [allWithdrawals]);

  // Save Ad Analytics
  useEffect(() => {
    localStorage.setItem('dc_ad_analytics', JSON.stringify(adAnalytics));
  }, [adAnalytics]);

  // Handle Login
  const handleLogin = (username: string) => {
    const key = username.toLowerCase();
    const allUsers = JSON.parse(localStorage.getItem('dc_users_registry') || '{}');
    
    if (allUsers[key]) {
      const user = allUsers[key];
      // Sync withdrawals from global state for this user
      user.withdrawals = allWithdrawals.filter(w => w.username.toLowerCase() === key);
      setCurrentUser(user);
    } else {
      // Automatic registration if not found
      handleRegister(username);
    }
  };

  // Handle Register
  const handleRegister = (username: string) => {
    const key = username.toLowerCase();
    const allUsers = JSON.parse(localStorage.getItem('dc_users_registry') || '{}');

    if (allUsers[key]) {
      alert('Username sudah terdaftar. Silakan login.');
      return;
    }

    // Create new user with 5,000 starter coins bonus!
    const newUser: User = {
      username,
      coins: 5000,
      totalEarnedCoins: 5000,
      watchTimeSeconds: 0,
      lastEarnedTimestamp: Date.now(),
      withdrawals: [],
      watchSessions: [
        {
          animeId: 'welcome-bonus',
          animeTitle: 'Bonus Pendaftaran Anggota Baru',
          durationSeconds: 0,
          coinsEarned: 5000,
          date: new Date().toLocaleString('id-ID', { hour12: false }).replace(/\//g, '-')
        }
      ]
    };

    allUsers[key] = newUser;
    localStorage.setItem('dc_users_registry', JSON.stringify(allUsers));
    setCurrentUser(newUser);
    alert('Registrasi berhasil! Anda mendapatkan bonus sambutan 5.000 Koin (Rp 500) gratis!');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentUser(null);
    navigateHome();
    setActiveTab('catalog');
  };

  // Handle Awarding Coins from watching anime
  const handleAwardCoins = (coins: number, milestoneLabel: string, secondsWatched: number) => {
    if (!currentUser || !selectedAnime) return;
    
    console.log(`Milestone ${milestoneLabel} tercapai! Menambahkan ${coins} koin.`);

    const formattedDate = new Date().toLocaleString('id-ID', { hour12: false }).replace(/\//g, '-');
    
    // Check if session log exists for current anime
    const updatedSessions = [...currentUser.watchSessions];
    const sessionIndex = updatedSessions.findIndex(s => s.animeId === selectedAnime.id && s.date.split(' ')[0] === formattedDate.split(' ')[0]);

    if (sessionIndex >= 0) {
      // Update existing session
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        durationSeconds: secondsWatched,
        coinsEarned: updatedSessions[sessionIndex].coinsEarned + coins,
      };
    } else {
      // Create new session log
      updatedSessions.push({
        animeId: selectedAnime.id,
        animeTitle: selectedAnime.title,
        durationSeconds: secondsWatched,
        coinsEarned: coins,
        date: formattedDate
      });
    }

    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        coins: prev.coins + coins,
        totalEarnedCoins: prev.totalEarnedCoins + coins,
        watchTimeSeconds: prev.watchTimeSeconds + 1, // incremental tracking
        watchSessions: updatedSessions
      };
    });

    // Also trigger ad revenue since user is actively watching
    handleAdImpression(1);
  };

  // Handle ad impression simulations (adds revenue for site owner)
  const handleAdImpression = (multiplier = 1) => {
    setAdAnalytics(prev => {
      const addedImpressions = Math.floor(Math.random() * 3) + 1 * multiplier;
      const nextImpressions = prev.impressions + addedImpressions;
      
      // Calculate earnings: CPM is per 1,000 impressions
      // USD earnings = (impressions * CPM) / 1000
      const nextEarnings = (nextImpressions * prev.cpm) / 1000;
      
      // Randomly tweak CTR between 2% and 3.5%
      const nextCtr = 2.0 + (Math.sin(nextImpressions) * 0.75 + 0.75);

      return {
        ...prev,
        impressions: nextImpressions,
        ctr: parseFloat(nextCtr.toFixed(2)),
        earningsUsd: parseFloat(nextEarnings.toFixed(2))
      };
    });
  };

  // Handle Withdrawal Submission
  const handleSubmitWithdrawal = (withdrawData: Omit<WithdrawalRequest, 'id' | 'username' | 'status' | 'date'>) => {
    if (!currentUser) return;

    const formattedDate = new Date().toLocaleString('id-ID', { hour12: false }).replace(/\//g, '-');
    const newRequest: WithdrawalRequest = {
      id: 'w-' + Date.now(),
      username: currentUser.username,
      status: 'Pending',
      date: formattedDate,
      ...withdrawData
    };

    // Update global withdrawals state
    setAllWithdrawals(prev => [newRequest, ...prev]);

    // Deduct coins from user balance
    setCurrentUser(prev => {
      if (!prev) return null;
      const updatedUser = {
        ...prev,
        coins: prev.coins - withdrawData.coins,
        withdrawals: [newRequest, ...prev.withdrawals]
      };
      return updatedUser;
    });

    // Trigger high-CPM ad redirection layout
    handleAdImpression(5); // heavy ad revenue trigger
  };

  // OWNER: Approve Withdrawal
  const handleApproveRequest = (id: string) => {
    // Update request status
    setAllWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'Approved' } : w));
    
    // Update in user registry if active or offline
    const request = allWithdrawals.find(w => w.id === id);
    if (request) {
      const allUsers = JSON.parse(localStorage.getItem('dc_users_registry') || '{}');
      const userKey = request.username.toLowerCase();
      
      if (allUsers[userKey]) {
        const user = allUsers[userKey];
        user.withdrawals = user.withdrawals.map((w: WithdrawalRequest) => w.id === id ? { ...w, status: 'Approved' } : w);
        allUsers[userKey] = user;
        localStorage.setItem('dc_users_registry', JSON.stringify(allUsers));
        
        // If the approved user is current logged-in user, sync state
        if (currentUser && currentUser.username.toLowerCase() === userKey) {
          setCurrentUser(user);
        }
      }
    }
    alert('Penarikan dana disetujui! Status diperbarui menjadi "Approved".');
  };

  // OWNER: Reject Withdrawal & Refund Coins
  const handleRejectRequest = (id: string) => {
    setAllWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: 'Rejected' } : w));
    
    const request = allWithdrawals.find(w => w.id === id);
    if (request) {
      const allUsers = JSON.parse(localStorage.getItem('dc_users_registry') || '{}');
      const userKey = request.username.toLowerCase();
      
      if (allUsers[userKey]) {
        const user = allUsers[userKey];
        // Refund coins
        user.coins += request.coins;
        user.withdrawals = user.withdrawals.map((w: WithdrawalRequest) => w.id === id ? { ...w, status: 'Rejected' } : w);
        allUsers[userKey] = user;
        localStorage.setItem('dc_users_registry', JSON.stringify(allUsers));
        
        // If active, sync state
        if (currentUser && currentUser.username.toLowerCase() === userKey) {
          setCurrentUser(user);
        }
      }
    }
    alert('Penarikan dana ditolak! Koin dikembalikan ke saldo pengguna.');
  };

  // Award from Sponsored ad click
  const handleSponsorAdReward = (coinsEarned: number) => {
    if (!currentUser) return;
    
    const formattedDate = new Date().toLocaleString('id-ID', { hour12: false }).replace(/\//g, '-');
    
    setCurrentUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        coins: prev.coins + coinsEarned,
        totalEarnedCoins: prev.totalEarnedCoins + coinsEarned,
        watchSessions: [
          ...prev.watchSessions,
          {
            animeId: 'quest-video-' + Date.now(),
            animeTitle: 'Bonus Misi Video Harian',
            durationSeconds: 15,
            coinsEarned: coinsEarned,
            date: formattedDate
          }
        ]
      };
    });

    // Award major impression count and cash for owner
    setAdAnalytics(prev => {
      const nextImpressions = prev.impressions + 10; // high weight
      const nextEarnings = (nextImpressions * 8.50) / 1000; // high CPM rate ($8.50) for video ads
      return {
        ...prev,
        impressions: nextImpressions,
        earningsUsd: parseFloat(nextEarnings.toFixed(2))
      };
    });

    alert(`Selamat! Anda mendapatkan +${coinsEarned} koin!`);
  };

  return (
    <div className="app-layout">
      {/* Navbar Header */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          navigateHome(); // Reset player and URL when navigation changes
        }}
        currentUser={currentUser}
        onOpenSponsorAd={() => {
          if (!currentUser) {
            alert('Silakan login terlebih dahulu untuk memulai misi video harian.');
          } else {
            setShowSponsorAd(true);
          }
        }}
      />

      {/* Main Content Render */}
      <main className="main-content">
        {selectedAnime ? (
          <Player 
            anime={selectedAnime}
            currentUser={currentUser}
            onBack={navigateHome}
            onAwardCoins={handleAwardCoins}
            onAdImpression={() => handleAdImpression(3)}
          />
        ) : activeTab === 'catalog' ? (
          <Catalog 
            animes={animes}
            isLoading={isLoading}
            onSelectAnime={setSelectedAnime}
            onAdImpression={() => handleAdImpression(2)}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard 
            currentUser={currentUser}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onLogout={handleLogout}
            onSubmitWithdrawal={handleSubmitWithdrawal}
          />
        ) : (
          <AdminPortal 
            requests={allWithdrawals}
            adAnalytics={adAnalytics}
            onApproveRequest={handleApproveRequest}
            onRejectRequest={handleRejectRequest}
          />
        )}
      </main>

      {/* Sponsor Video Ad Modal Popup */}
      {showSponsorAd && (
        <SponsorAd 
          onClose={() => setShowSponsorAd(false)}
          onReward={handleSponsorAdReward}
        />
      )}

      {/* Clean Footer */}
      <footer className="clean-footer" style={{
        textAlign: 'center',
        padding: '24px 0',
        color: 'var(--text-muted)',
        fontSize: '13px',
        borderTop: '1px solid var(--border-light)',
        marginTop: '48px',
        backdropFilter: 'var(--glass-blur)'
      }}>
        <p>&copy; 2026 AnimeCuan. Platform Streaming Anime Subtitle Indonesia Terpopuler.</p>
      </footer>
    </div>
  );
}
export default App;
