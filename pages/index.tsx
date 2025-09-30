import { useState, useEffect } from 'react';
import axios from 'axios';

interface DownloadData {
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnail?: string;
  title?: string;
  duration?: number;
  timestamp: number;
}

interface DownloadHistory {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  timestamp: number;
  type: string;
}

export default function TikTokDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);

  // Load from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const savedHistory = localStorage.getItem('downloadHistory');
    
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
    if (savedHistory) setDownloadHistory(JSON.parse(savedHistory));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
  }, [downloadHistory]);

  // Auto download
  useEffect(() => {
    if (downloadData && downloadData.url) {
      const newHistoryItem: DownloadHistory = {
        id: Date.now().toString(),
        url: downloadData.url,
        title: downloadData.title || 'TikTok Video',
        thumbnail: downloadData.thumbnail,
        timestamp: downloadData.timestamp,
        type: downloadData.type
      };
      
      setDownloadHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
      autoDownloadFile(downloadData.url, downloadData.type);
    }
  }, [downloadData]);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Masukkan URL TikTok');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadData(null);

    try {
      const response = await axios.post('/api/download', { url });
      
      if (response.data.success) {
        setDownloadData({
          ...response.data.data,
          timestamp: Date.now()
        });
      } else {
        setError(response.data.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const autoDownloadFile = async (downloadUrl: string, type: 'video' | 'image' | 'audio') => {
    try {
      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        setError('URL download tidak valid');
        return;
      }

      const fileExtension = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg';
      const filename = `tiktok-${Date.now()}.${fileExtension}`;

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch video');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    } catch (err: any) {
      console.error('Auto download error:', err);
      window.open(downloadUrl, '_blank');
    }
  };

  const clearHistory = () => {
    setDownloadHistory([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID');
  };

  return (
    <div className={`tiktok-downloader ${darkMode ? 'dark' : 'light'}`}>
      <div className="container">
        
        {/* Top Bar */}
        <div className="top-bar">
          <div className="logo">
            <div className="logo-icon">⬇️</div>
            <h1 className="title">TikTok Downloader</h1>
          </div>

          <div className="controls">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-secondary"
            >
              📜 {showHistory ? 'Sembunyikan' : 'Riwayat'} 
              {downloadHistory.length > 0 && ` (${downloadHistory.length})`}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-secondary"
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

        <div className={`main-grid ${showHistory ? 'with-history' : ''}`}>
          
          {/* Main Content */}
          <div className="main-content">
            <p className="subtitle">
              Download video TikTok tanpa watermark • Cepat & Gratis
            </p>

            {/* Input Section */}
            <div className="card">
              <div className="input-group">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="🔗 Paste URL TikTok di sini (vt.tiktok.com, vm.tiktok.com, tiktok.com)"
                  className={`url-input ${darkMode ? '' : 'light'}`}
                />
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="loading-spinner"></div>
                      Memproses...
                    </div>
                  ) : (
                    '🚀 Download Now'
                  )}
                </button>
              </div>
              
              {error && (
                <div className="error-message">
                  <span>⚠️</span>
                  {error}
                </div>
              )}
            </div>

            {/* Result Section */}
            {downloadData && (
              <div className="card">
                <div className="success-header">
                  <div className="success-icon">✅</div>
                  <h3 className="success-title">Download Berhasil!</h3>
                </div>
                
                {downloadData.thumbnail && (
                  <div className="thumbnail">
                    <img src={downloadData.thumbnail} alt="Thumbnail" />
                  </div>
                )}

                <div className="action-buttons">
                  <button
                    onClick={() => autoDownloadFile(downloadData.url, downloadData.type)}
                    className="btn-success"
                  >
                    ⬇️ Download Ulang
                  </button>

                  <a
                    href={downloadData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                  >
                    🔗 Buka di Tab Baru
                  </a>
                </div>

                {downloadData.title && (
                  <p className="video-title">
                    "{downloadData.title}"
                  </p>
                )}

                <div className="download-status">
                  <span style={{ color: '#00f2ea' }}>⚡</span>
                  <span>Video sedang didownload otomatis...</span>
                </div>
              </div>
            )}

            {/* Features Section */}
            <div className="card">
              <h3 className="success-title" style={{ textAlign: 'center', marginBottom: '25px' }}>
                🎯 Kenapa Pilih Kami?
              </h3>
              
              <div className="features-grid">
                {[
                  { icon: '🚀', title: 'Super Cepat', desc: 'Proses download dalam hitungan detik' },
                  { icon: '🎨', title: 'HD Quality', desc: 'Video berkualitas tinggi tanpa watermark' },
                  { icon: '💯', title: 'Gratis', desc: 'Tanpa biaya, tanpa registrasi' },
                  { icon: '📱', title: 'All Devices', desc: 'Bisa di desktop dan mobile' }
                ].map((feature, index) => (
                  <div key={index} className="feature-card">
                    <div className="feature-icon">{feature.icon}</div>
                    <h4 className="feature-title">{feature.title}</h4>
                    <p className="feature-desc">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* History Sidebar */}
          {showHistory && (
            <div className="history-sidebar">
              <div className="history-header">
                <h3 className="history-title">📜 Riwayat Download</h3>
                {downloadHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="btn-clear"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="history-list">
                {downloadHistory.length === 0 ? (
                  <div className="history-empty">
                    📝 Belum ada riwayat download
                  </div>
                ) : (
                  downloadHistory.map((item) => (
                    <div
                      key={item.id}
                      className="history-item"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <div className="history-content">
                        {item.thumbnail && (
                          <img 
                            src={item.thumbnail} 
                            alt="Thumb"
                            className="history-thumb"
                          />
                        )}
                        <div className="history-details">
                          <p className="history-item-title">
                            {item.title}
                          </p>
                          <p className="history-time">
                            {formatTime(item.timestamp)}
                          </p>
                          <p className="history-type">
                            {item.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer">
          <p>© 2024 TikTok Downloader • Made with ❤️ for content creators</p>
        </div>
      </div>
    </div>
  );
  }
