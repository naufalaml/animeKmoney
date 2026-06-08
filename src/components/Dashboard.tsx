import React, { useState } from 'react';
import type { User, WithdrawalRequest } from '../types';
import { Wallet, LogIn, UserPlus, LogOut, ArrowUpRight, History, HelpCircle } from 'lucide-react';

interface DashboardProps {
  currentUser: User | null;
  onLogin: (username: string) => void;
  onRegister: (username: string) => void;
  onLogout: () => void;
  onSubmitWithdrawal: (request: Omit<WithdrawalRequest, 'id' | 'username' | 'status' | 'date'>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onLogin,
  onRegister,
  onLogout,
  onSubmitWithdrawal,
}) => {
  // Authentication states
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authUsername, setAuthUsername] = useState('');
  
  // Withdrawal Form states
  const [paymentMethod, setPaymentMethod] = useState<'DANA' | 'OVO' | 'GoPay' | 'Transfer Bank'>('DANA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawCoins, setWithdrawCoins] = useState<number>(500000); // default to minimum 500,000 coins (Rp 50.000)

  const minWithdrawCoins = 500000; // Rp 50.000

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim()) return;
    
    if (isLoginMode) {
      onLogin(authUsername.trim());
    } else {
      onRegister(authUsername.trim());
    }
    setAuthUsername('');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (currentUser.coins < withdrawCoins) {
      alert('Saldo koin Anda tidak mencukupi untuk melakukan penarikan.');
      return;
    }

    if (withdrawCoins < minWithdrawCoins) {
      alert(`Minimum penarikan adalah ${minWithdrawCoins.toLocaleString('id-ID')} koin (Rp 50.000).`);
      return;
    }

    if (!accountNumber || !accountName) {
      alert('Harap isi semua detail akun penarikan.');
      return;
    }

    // Amount calculation (1000 coins = 100 rupiah -> multiplier 0.1)
    const amountIdr = Math.floor(withdrawCoins * 0.1);

    onSubmitWithdrawal({
      amount: amountIdr,
      coins: withdrawCoins,
      paymentMethod,
      accountDetails: `${accountName} (${accountNumber})`
    });

    // Reset Form
    setAccountNumber('');
    setAccountName('');
    alert('Permintaan penarikan berhasil diajukan! Silakan tunggu persetujuan admin/owner.');
  };

  // Convert current input coins to IDR
  const coinsToIdr = (coins: number) => {
    return Math.floor(coins * 0.1).toLocaleString('id-ID');
  };

  return (
    <div className="dashboard-container">
      {!currentUser ? (
        /* Auth Portal Card */
        <div className="auth-card">
          <div className="auth-header">
            <h2>{isLoginMode ? 'Login ke AnimeCuan' : 'Daftar Akun AnimeCuan'}</h2>
            <p>Mulai nonton anime Jepang favorit Anda dan tukar waktu Anda dengan Rupiah asli.</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Username Akun</label>
              <input
                id="username"
                type="text"
                placeholder="Masukkan username Anda..."
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                required
              />
            </div>
            
            <button type="submit" className="auth-submit-btn">
              {isLoginMode ? <LogIn size={18} /> : <UserPlus size={18} />}
              {isLoginMode ? 'Masuk Sekarang' : 'Daftar & Klaim Bonus'}
            </button>
          </form>

          <div className="auth-switch">
            <span>
              {isLoginMode ? 'Belum punya akun?' : 'Sudah memiliki akun?'}
            </span>
            <button 
              type="button" 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="switch-btn"
            >
              {isLoginMode ? 'Daftar di sini' : 'Login di sini'}
            </button>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            🔒 Koneksi terenkripsi aman & 100% data pribadi terlindungi.
          </div>
        </div>
      ) : (
        /* Logged In Dashboard Layout */
        <div className="dashboard-grid">
          {/* Main Account Info */}
          <div className="db-left-section">
            {/* User Profile Card */}
            <div className="profile-card">
              <div className="profile-info-row">
                <div className="avatar">CN</div>
                <div>
                  <h2>Hai, {currentUser.username}!</h2>
                  <span className="user-role-badge">Anggota VIP</span>
                </div>
                <button className="logout-btn" onClick={onLogout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="stats-cards-grid">
                <div className="stat-card gold">
                  <span className="card-label">Saldo Koin Saat Ini</span>
                  <h3 className="card-value">{currentUser.coins.toLocaleString('id-ID')}</h3>
                  <span className="card-subvalue">≈ Rp {coinsToIdr(currentUser.coins)}</span>
                </div>
                
                <div className="stat-card cyan">
                  <span className="card-label">Total Pendapatan</span>
                  <h3 className="card-value">{currentUser.totalEarnedCoins.toLocaleString('id-ID')}</h3>
                  <span className="card-subvalue">≈ Rp {coinsToIdr(currentUser.totalEarnedCoins)}</span>
                </div>

                <div className="stat-card purple">
                  <span className="card-label">Total Menonton</span>
                  <h3 className="card-value">
                    {Math.floor(currentUser.watchTimeSeconds / 60)} <span className="text-xs">menit</span>
                  </h3>
                  <span className="card-subvalue">{currentUser.watchTimeSeconds} detik terhitung</span>
                </div>
              </div>
            </div>

            {/* Withdrawal History & Activity logs */}
            <div className="history-card">
              <div className="history-tabs">
                <h3><History size={18} /> Riwayat Penarikan Dana</h3>
              </div>
              
              {currentUser.withdrawals.length === 0 ? (
                <div className="empty-history">
                  <p>Anda belum pernah melakukan penarikan saldo.</p>
                  <p className="subtext">Kumpulkan koin Anda dan lakukan penarikan pertama Anda.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Metode</th>
                        <th>Akun Tujuan</th>
                        <th>Koin Ditukar</th>
                        <th>Nominal (IDR)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUser.withdrawals.map((withdraw) => (
                        <tr key={withdraw.id}>
                          <td>{withdraw.date}</td>
                          <td>{withdraw.paymentMethod}</td>
                          <td>{withdraw.accountDetails}</td>
                          <td>{withdraw.coins.toLocaleString('id-ID')}</td>
                          <td>Rp {withdraw.amount.toLocaleString('id-ID')}</td>
                          <td>
                            <span className={`status-badge ${withdraw.status.toLowerCase()}`}>
                              {withdraw.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Watch History Log */}
            <div className="history-card mt-6">
              <div className="history-tabs">
                <h3><History size={18} /> Riwayat Menonton & Koin</h3>
              </div>
              
              {currentUser.watchSessions.length === 0 ? (
                <div className="empty-history">
                  <p>Belum ada riwayat aktivitas menonton.</p>
                  <p className="subtext">Silakan tonton anime di halaman beranda untuk mulai menabung koin.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Tanggal</th>
                        <th>Judul Anime</th>
                        <th>Durasi Tonton</th>
                        <th>Koin Didapat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUser.watchSessions.map((session, index) => (
                        <tr key={index}>
                          <td>{session.date}</td>
                          <td>{session.animeTitle}</td>
                          <td>{Math.floor(session.durationSeconds)} detik</td>
                          <td className="text-yellow-400 font-bold">+{session.coinsEarned} Koin</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Withdraw Form & Calculator */}
          <div className="db-right-section">
            <div className="withdraw-card">
              <div className="card-header-icon">
                <Wallet className="wallet-icon" size={24} />
                <h2>Tarik Koin Jadi Uang</h2>
              </div>
              <p className="withdraw-desc">
                Konversikan koin Anda menjadi uang rupiah tunai. Saldo akan dikirimkan langsung ke e-wallet atau bank Anda.
              </p>

              {/* Rate Alert */}
              <div className="info-box">
                <HelpCircle size={16} />
                <span>Rate Konversi: <strong>1.000 Koin = Rp 100</strong>. Minimal penarikan Rp 50.000 (500.000 Koin).</span>
              </div>

              {/* Withdraw Form */}
              <form onSubmit={handleWithdrawSubmit} className="withdraw-form">
                <div className="form-group">
                  <label htmlFor="method">Metode Penarikan</label>
                  <select 
                    id="method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="DANA">DANA (E-Wallet)</option>
                    <option value="OVO">OVO (E-Wallet)</option>
                    <option value="GoPay">GoPay (E-Wallet)</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="account-name">Nama Pemilik Akun / Rekening</label>
                  <input
                    id="account-name"
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="account-num">Nomor HP E-Wallet / Nomor Rekening</label>
                  <input
                    id="account-num"
                    type="text"
                    placeholder="Contoh: 08123456789 atau 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="coins-amt">Jumlah Koin yang Ditukar</label>
                  <input
                    id="coins-amt"
                    type="number"
                    min={minWithdrawCoins}
                    step={1000}
                    value={withdrawCoins}
                    onChange={(e) => setWithdrawCoins(parseInt(e.target.value) || 0)}
                    required
                  />
                  <div className="calc-preview">
                    Anda akan menerima: <strong>Rp {coinsToIdr(withdrawCoins)}</strong>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="withdraw-submit-btn"
                  disabled={currentUser.coins < withdrawCoins}
                >
                  Ajukan Penarikan <ArrowUpRight size={18} />
                </button>

                {currentUser.coins < withdrawCoins && (
                  <p className="error-text">Koin tidak cukup. Tonton lebih banyak anime untuk menambah koin.</p>
                )}
              </form>
            </div>
            
            {/* Earn Coins Tips Card */}
            <div className="tips-card" style={{
              background: 'linear-gradient(to bottom, rgba(20, 20, 25, 0.95), rgba(10, 10, 12, 0.95))',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'left',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(168, 85, 247, 0.05)'
            }}>
              <h3 style={{ color: 'var(--accent-pink)', fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                💡 Tips Hasilkan Lebih Banyak Koin
              </h3>
              <ul style={{ paddingLeft: '16px', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', margin: 0, lineHeight: '1.5' }}>
                <li>Tonton anime rekomendasi terpopuler untuk mendapatkan koin yang lebih cepat.</li>
                <li>Tetap aktifkan tab pemutar video Anda agar status detektor tidak terhenti.</li>
                <li>Klaim koin Anda secara teratur setiap kali mencapai batas milestone menonton.</li>
                <li>Gunakan DNS Aman (Google / Cloudflare) jika koneksi video Anda terhambat oleh provider internet.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Dashboard;
