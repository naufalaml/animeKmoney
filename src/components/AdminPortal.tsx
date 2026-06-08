import React from 'react';
import type { WithdrawalRequest, AdAnalytics } from '../types';
import { BarChart3, Users, DollarSign, Check, X, ShieldAlert, BookOpen, AlertCircle } from 'lucide-react';

interface AdminPortalProps {
  requests: WithdrawalRequest[];
  adAnalytics: AdAnalytics;
  onApproveRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  requests,
  adAnalytics,
  onApproveRequest,
  onRejectRequest,
}) => {
  // 1 USD = Rp 15.500
  const usdToIdr = (usd: number) => {
    return Math.floor(usd * 15500).toLocaleString('id-ID');
  };

  return (
    <div className="admin-container">
      <div className="admin-header-row">
        <div>
          <h2>Owner Portal & Analytics</h2>
          <p>Kelola pencairan saldo pengguna dan pantau performa platform & metrik konversi Anda.</p>
        </div>
        <span className="owner-badge">OWNER MODE ACTIVE</span>
      </div>

      {/* Analytics Row */}
      <div className="admin-stats-grid">
        <div className="astat-card">
          <div className="astat-header">
            <BarChart3 className="text-green-400" />
            <span>Total Impresi Platform</span>
          </div>
          <h3>{adAnalytics.impressions.toLocaleString('id-ID')}</h3>
          <span className="astat-sub text-xs">Aktivitas Pemutar Video & Halaman</span>
        </div>

        <div className="astat-card">
          <div className="astat-header">
            <Users className="text-blue-400" />
            <span>Rata-Rata Keaktifan</span>
          </div>
          <h3>{adAnalytics.ctr.toFixed(2)} %</h3>
          <span className="astat-sub text-xs">Rasio interaksi aktif penonton</span>
        </div>

        <div className="astat-card">
          <div className="astat-header">
            <DollarSign className="text-yellow-400" />
            <span>Konversi Nilai Layanan</span>
          </div>
          <h3>$ {adAnalytics.cpm.toFixed(2)}</h3>
          <span className="astat-sub text-xs">Pendapatan per 1.000 interaksi</span>
        </div>

        <div className="astat-card revenue">
          <div className="astat-header">
            <DollarSign className="text-yellow-400" />
            <span>Estimasi Omzet Anda</span>
          </div>
          <h3>$ {adAnalytics.earningsUsd.toFixed(2)}</h3>
          <span className="astat-sub text-xs font-bold text-green-300">
            ≈ Rp {usdToIdr(adAnalytics.earningsUsd)}
          </span>
        </div>
      </div>

      {/* Pending Withdrawals */}
      <div className="admin-content-grid">
        <div className="requests-section">
          <div className="section-header">
            <h3><AlertCircle size={18} /> Persetujuan Penarikan Saldo Pengguna</h3>
            <span className="pending-count">
              {requests.filter(r => r.status === 'Pending').length} Pending
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="no-requests">
              <p>Tidak ada pengajuan penarikan dana.</p>
              <p className="subtext">Pengajuan penarikan dari pengguna akan muncul di sini.</p>
            </div>
          ) : (
            <div className="requests-list">
              {requests.map((req) => (
                <div key={req.id} className={`request-item-card ${req.status.toLowerCase()}`}>
                  <div className="req-header">
                    <div>
                      <strong className="user-title">{req.username}</strong>
                      <span className="date-tag">{req.date}</span>
                    </div>
                    <span className={`req-status ${req.status.toLowerCase()}`}>{req.status}</span>
                  </div>

                  <div className="req-body">
                    <div className="req-info-col">
                      <span className="label">Metode Penarikan</span>
                      <span className="val font-bold text-white">{req.paymentMethod}</span>
                    </div>
                    <div className="req-info-col">
                      <span className="label">No Rekening/E-Wallet</span>
                      <span className="val text-green-400">{req.accountDetails}</span>
                    </div>
                    <div className="req-info-col">
                      <span className="label">Uang Ditransfer</span>
                      <span className="val font-bold text-yellow-400">Rp {req.amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="req-info-col">
                      <span className="label">Koin Didebit</span>
                      <span className="val">{req.coins.toLocaleString('id-ID')} Koin</span>
                    </div>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="req-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => onApproveRequest(req.id)}
                      >
                        <Check size={16} /> Setujui & Transfer Uang
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => onRejectRequest(req.id)}
                      >
                        <X size={16} /> Tolak Penarikan
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Optimization & Server Guide */}
        <div className="ad-guide-section">
          <div className="section-header">
            <h3><BookOpen size={18} /> Panduan Optimasi & Manajemen Layanan</h3>
          </div>
          
          <div className="guide-content">
            <p className="intro-p">
              Platform streaming AnimeCuan didesain untuk menyajikan konten anime dengan latensi rendah dan perlindungan data yang kuat. Ikuti panduan pemeliharaan berikut:
            </p>

            <div className="network-box">
              <h5>1. Pemeliharaan & Manajemen Mirror Streaming</h5>
              <p>Untuk memastikan video dapat diputar dengan lancar bagi seluruh pengguna di Indonesia:</p>
              <ul>
                <li><strong>Gunakan DNS Aman:</strong> Sosialisasikan penggunaan Secure DNS Cloudflare (1.1.1.1) kepada penonton untuk mengatasi pemblokiran server media oleh ISP tertentu.</li>
                <li><strong>Update Server URL Secara Berkala:</strong> Integrasikan server cadangan berkualitas tinggi untuk menjamin redundansi stream data.</li>
              </ul>
            </div>

            <div className="network-box">
              <h5>2. Keamanan Transaksi Koin & Anti-Cheat</h5>
              <p>Sistem detektor keaktifan (Anti-Cheat) memantau aktivitas secara dinamis:</p>
              <ul>
                <li><strong>Visibilitas Tab:</strong> Pelacakan dihentikan secara otomatis jika pengguna meninggalkan atau meminimalkan tab browser.</li>
                <li><strong>Batas Maksimal Menonton:</strong> Pembatasan koin harian untuk menjaga kestabilan ekonomi koin di platform.</li>
              </ul>
            </div>

            <div className="steps-box">
              <h5>Langkah Pengelolaan Saldo dan Penarikan:</h5>
              <ol>
                <li>Pantau daftar pengajuan penarikan koin penonton pada tabel sebelah kiri.</li>
                <li>Verifikasi keaslian sesi menonton pengguna sebelum melakukan transfer manual via E-Wallet (DANA/OVO/GoPay).</li>
                <li>Klik tombol <strong>"Setujui & Transfer Uang"</strong> jika valid, atau <strong>"Tolak Penarikan"</strong> jika terindikasi kecurangan.</li>
                <li>Gunakan portal administrasi ini dengan bijak untuk menjaga keseimbangan ekonomi sistem koin.</li>
              </ol>
            </div>
            
            <div className="warn-box">
              <ShieldAlert className="text-yellow-400 flex-shrink-0" size={20} />
              <p className="text-xs">
                <strong>Tips Keamanan:</strong> Selalu cek log transaksi secara berkala untuk menghindari pemalsuan nilai saldo koin oleh pihak ketiga.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminPortal;
