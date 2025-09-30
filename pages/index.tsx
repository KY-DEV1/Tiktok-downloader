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
  const [isMobile, setIsMobile] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([]);

  // Load theme and history from localStorage on component mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const savedTheme = localStorage.getItem('darkMode');
    const savedHistory = localStorage.getItem('downloadHistory');
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    if (savedTheme !== null) {
      setDarkMode(JSON.parse(savedTheme));
    }
    
    if (savedHistory) {
      setDownloadHistory(JSON.parse(savedHistory));
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
  }, [downloadHistory]);

  // AUTO DOWNLOAD ketika downloadData berubah
  useEffect(() => {
    if (downloadData && downloadData.url) {
      // Add to history
      const newHistoryItem: DownloadHistory = {
        id: Date.now().toString(),
        url: downloadData.url,
        title: downloadData.title || 'TikTok Video',
        thumbnail: downloadData.thumbnail,
        timestamp: downloadData.timestamp,
        type: downloadData.type
      };
      
      setDownloadHistory(prev => [newHistoryItem, ...prev.slice(0, 49)]); // Keep last 50 items
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

  // FUNCTION AUTO DOWNLOAD
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

  // Theme colors
  const theme = {
    background: darkMode 
      ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' 
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: darkMode 
      ? 'rgba(30, 30, 40, 0.8)' 
      : 'rgba(255, 255, 255, 0.1)',
    text: darkMode ? 'white' : 'white',
    textMuted: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.8)',
    border: darkMode 
      ? '1px solid rgba(255, 255, 255, 0.1)' 
      : '1px solid rgba(255, 255, 255, 0.2)',
    buttonBg: 'linear-gradient(45deg, #ff0050, #ff0080)',
    successBg: 'linear-gradient(45deg, #00f2ea, #00b894)',
    secondaryBg: darkMode 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(255, 255, 255, 0.2)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.background,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '20px',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px'
      }}>
        {/* Top Bar dengan Theme Toggle dan History Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flex: 1
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(45deg, #ff0050, #00f2ea)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              ⬇️
            </div>
            <h1 style={{
              fontSize: isMobile ? '1.8rem' : '2.5rem',
              fontWeight: '800',
              background: 'linear-gradient(45deg, #fff, #e0e7ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              TikTok Downloader
            </h1>
          </div>

          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '12px 20px',
                background: theme.secondaryBg,
                color: theme.text,
                border: theme.border,
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = darkMode 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = theme.secondaryBg;
              }}
            >
              📜 {showHistory ? 'Sembunyikan' : 'Riwayat'} 
              {downloadHistory.length > 0 && ` (${downloadHistory.length})`}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                padding: '12px 20px',
                background: theme.secondaryBg,
                color: theme.text,
                border: theme.border,
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(10px)',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = darkMode 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = theme.secondaryBg;
              }}
            >
              {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: showHistory ? '1fr 350px' : '1fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Main Content */}
          <div>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.1rem',
              color: theme.textMuted,
              marginBottom: '30px',
              fontWeight: '300',
              textAlign: 'center'
            }}>
              Download video TikTok tanpa watermark • Cepat & Gratis
            </p>

            {/* Input Section */}
            <div style={{
              background: theme.cardBg,
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '30px',
              marginBottom: '30px',
              border: theme.border,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '15px',
                flexDirection: isMobile ? 'column' : 'row'
              }}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="🔗 Paste URL TikTok di sini (vt.tiktok.com, vm.tiktok.com, tiktok.com)"
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                    color: darkMode ? 'white' : 'black',
                    backdropFilter: 'blur(10px)',
                    outline: 'none',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 1)';
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  style={{
                    padding: '16px 32px',
                    background: loading 
                      ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' 
                      : theme.buttonBg,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    minWidth: '140px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(255, 0, 80, 0.3)',
                    opacity: loading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 0, 80, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 0, 80, 0.3)';
                    }
                  }}
                >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Memproses...
                    </div>
                  ) : (
                    '🚀 Download Now'
                  )}
                </button>
              </div>
              
              {error && (
                <div style={{ 
                  background: 'rgba(255, 100, 100, 0.2)',
                  color: '#ff6b6b',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginTop: '15px',
                  border: '1px solid rgba(255, 100, 100, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>⚠️</span>
                  {error}
                </div>
              )}
            </div>

            {/* Result Section */}
            {downloadData && (
              <div style={{
                background: theme.cardBg,
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '30px',
                marginBottom: '30px',
                border: theme.border,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                animation: 'fadeIn 0.5s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: theme.successBg,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: 'white'
                  }}>
                    ✅
                  </div>
                  <h3 style={{
                    fontSize: isMobile ? '1.3rem' : '1.5rem',
                    fontWeight: '600',
                    color: theme.text,
                    margin: 0
                  }}>
                    Download Berhasil!
                  </h3>
                </div>
                
                {downloadData.thumbnail && (
                  <div style={{
                    marginBottom: '20px',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
                  }}>
                    <img 
                      src={downloadData.thumbnail} 
                      alt="Thumbnail"
                      style={{ 
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '15px',
                  justifyContent: isMobile ? 'center' : 'flex-start'
                }}>
                  <button
                    onClick={() => autoDownloadFile(downloadData.url, downloadData.type)}
                    style={{
                      padding: '12px 24px',
                      background: theme.successBg,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 242, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    ⬇️ Download Ulang
                  </button>

                  <a
                    href={downloadData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '12px 24px',
                      background: theme.secondaryBg,
                      color: theme.text,
                      textDecoration: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: theme.border
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.secondaryBg;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    🔗 Buka di Tab Baru
                  </a>
                </div>

                {downloadData.title && (
                  <p style={{
                    marginTop: '10px',
                    color: theme.textMuted,
                    fontStyle: 'italic',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    "{downloadData.title}"
                  </p>
                )}

                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  background: 'rgba(0, 242, 234, 0.1)',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 242, 234, 0.3)',
                  display: 'flex',
                  alignItems: '
