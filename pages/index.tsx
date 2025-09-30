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

interface MediaOption {
  id: 'video' | 'audio' | 'image';
  label: string;
  icon: string;
  description: string;
}

export default function TikTokDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<'video' | 'audio' | 'image'>('video');
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);

  const mediaTypes: MediaOption[] = [
    {
      id: 'video',
      label: 'Video',
      icon: '🎬',
      description: 'Download video dengan kualitas HD'
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: '🎵',
      description: 'Ekstrak audio saja (format MP3)'
    },
    {
      id: 'image',
      label: 'Gambar',
      icon: '🖼️',
      description: 'Download thumbnail/gambar'
    }
  ];

  // Load from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    const savedHistory = localStorage.getItem('downloadHistory');
    
    if (savedTheme) setDarkMode(JSON.parse(savedTheme));
    if (savedHistory) setDownloadHistory(JSON.parse(savedHistory));
    
    // Set initial media options
    setMediaOptions(mediaTypes);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
  }, [downloadHistory]);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Masukkan URL TikTok');
      return;
    }

    setLoading(true);
    setError('');
    setDownloadData(null);

    try {
      const response = await axios.post('/api/download', { 
        url,
        mediaType: selectedMedia 
      });
      
      if (response.data.success) {
        const downloadItem = {
          ...response.data.data,
          timestamp: Date.now()
        };
        
        setDownloadData(downloadItem);
        
        // Add to history
        const newHistoryItem: DownloadHistory = {
          id: Date.now().toString(),
          url: downloadItem.url,
          title: downloadItem.title || 'TikTok Media',
          thumbnail: downloadItem.thumbnail,
          timestamp: downloadItem.timestamp,
          type: downloadItem.type
        };
        
        setDownloadHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]);
      } else {
        setError(response.data.error || 'Gagal mengambil data');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDownload = async (downloadUrl: string, filename: string) => {
    try {
      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        setError('URL download tidak valid');
        return;
      }

      // Show loading for download
      const downloadBtn = document.getElementById('download-btn');
      if (downloadBtn) {
        downloadBtn.innerHTML = '⬇️ Mengunduh...';
        downloadBtn.setAttribute('disabled', 'true');
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch media');

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

      // Reset button
      if (downloadBtn) {
        downloadBtn.innerHTML = '⬇️ Download Ulang';
        downloadBtn.removeAttribute('disabled');
      }

    } catch (err: any) {
      console.error('Download error:', err);
      setError('Gagal mengunduh file: ' + err.message);
      
      // Fallback: open in new tab
      window.open(downloadUrl, '_blank');
    }
  };

  const getFilename = (type: string, title?: string) => {
    const baseName = title ? title.replace(/[^a-zA-Z0-9]/g, '_') : 'tiktok';
    const extensions = {
      video: 'mp4',
      audio: 'mp3',
      image: 'jpg'
    };
    return `${baseName}_${Date.now()}.${extensions[type as keyof typeof extensions] || 'mp4'}`;
  };

  const clearHistory = () => {
    setDownloadHistory([]);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID');
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬';
      case 'audio': return '🎵';
      case 'image': return '🖼️';
      default: return '📁';
    }
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
              Download video, audio, dan gambar dari TikTok • Cepat & Gratis
            </p>

            {/* Media Type Selection */}
            <div className="card">
              <h3 className="success-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                📁 Pilih Jenis Media
              </h3>
              
              <div className="features-grid">
                {mediaTypes.map((media) => (
                  <div 
                    key={media.id}
                    className={`feature-card ${selectedMedia === media.id ? 'selected-media' : ''}`}
                    style={{
                      border: selectedMedia === media.id ? '2px solid #00f2ea' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: selectedMedia === media.id ? 'rgba(0, 242, 234, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setSelectedMedia(media.id)}
                  >
                    <div className="feature-icon">{media.icon}</div>
                    <h4 className="feature-title">{media.label}</h4>
                    <p className="feature-desc">{media.description}</p>
                  </div>
                ))}
              </div>
            </div>

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
                    `🚀 Download ${selectedMedia === 'video' ? 'Video' : selectedMedia === 'audio' ? 'Audio' : 'Gambar'}`
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
                  <h3 className="success-title">
                    {downloadData.type === 'video' ? 'Video' : 
                     downloadData.type === 'audio' ? 'Audio' : 'Gambar'} Siap Download!
                  </h3>
                </div>
                
                {downloadData.thumbnail && downloadData.type !== 'audio' && (
                  <div className="thumbnail">
                    <img src={downloadData.thumbnail} alt="Thumbnail" />
                  </div>
                )}

                {downloadData.type === 'audio' && (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(0, 242, 234, 0.1)',
                    borderRadius: '10px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎵</div>
                    <p style={{ color: 'white', margin: 0 }}>Audio siap untuk diunduh</p>
                  </div>
                )}

                <div className="action-buttons">
                  <button
                    id="download-btn"
                    onClick={() => handleFileDownload(
                      downloadData.url, 
                      getFilename(downloadData.type, downloadData.title)
                    )}
                    className="btn-success"
                  >
                    ⬇️ Download {downloadData.type === 'video' ? 'Video' : 
                               downloadData.type === 'audio' ? 'Audio' : 'Gambar'}
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

                {downloadData.duration && downloadData.type === 'video' && (
                  <p style={{
                    marginTop: '10px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    ⏱️ Durasi: {Math.floor(downloadData.duration / 60)}:
                    {(downloadData.duration % 60).toString().padStart(2, '0')}
                  </p>
                )}
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
                  { icon: '🎨', title: 'HD Quality', desc: 'Kualitas terbaik tanpa watermark' },
                  { icon: '🎵', title: 'Multiple Format', desc: 'Video, audio, dan gambar' },
                  { icon: '💯', title: 'Gratis', desc: 'Tanpa biaya, tanpa registrasi' }
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
                        {item.thumbnail && item.type !== 'audio' && (
                          <img 
                            src={item.thumbnail} 
                            alt="Thumb"
                            className="history-thumb"
                          />
                        )}
                        {item.type === 'audio' && (
                          <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'rgba(0, 242, 234, 0.2)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px'
                          }}>
                            🎵
                          </div>
                        )}
                        <div className="history-details">
                          <p className="history-item-title">
                            {item.title}
                          </p>
                          <p className="history-time">
                            {formatTime(item.timestamp)}
                          </p>
                          <p className="history-type">
                            {getMediaIcon(item.type)} {item.type.toUpperCase()}
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

      <style jsx>{`
        .selected-media {
          transform: scale(1.05);
        }
        
        .feature-card {
          transition: all 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
    }
