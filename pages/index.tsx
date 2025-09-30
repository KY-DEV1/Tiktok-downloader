import { useState, useEffect } from 'react';
import axios from 'axios';

interface DownloadData {
  type: 'video' | 'image' | 'audio';
  url: string;
  thumbnail?: string;
  title?: string;
  duration?: number;
}

export default function TikTokDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadData, setDownloadData] = useState<DownloadData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on component mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // AUTO DOWNLOAD ketika downloadData berubah
  useEffect(() => {
    if (downloadData && downloadData.url) {
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
        setDownloadData(response.data.data);
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
      console.log('Starting auto download:', downloadUrl);
      
      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        setError('URL download tidak valid');
        return;
      }

      const fileExtension = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg';
      const filename = `tiktok-${Date.now()}.${fileExtension}`;

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

    } catch (err: any) {
      console.error('Auto download error:', err);
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '10px',
          flexDirection: isMobile ? 'column' : 'row'
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
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            background: 'linear-gradient(45deg, #fff, #e0e7ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            TikTok Downloader
          </h1>
        </div>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.2rem',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '40px',
          fontWeight: '300'
        }}>
          Download video TikTok tanpa watermark • Cepat & Gratis
        </p>

        {/* Input Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
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
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                outline: 'none',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.transform = 'scale(1.02)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.9)';
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
                  : 'linear-gradient(45deg, #ff0050, #ff0080)',
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
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '30px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
                background: 'linear-gradient(45deg, #00b894, #00cec9)',
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
                color: 'white',
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
                  background: 'linear-gradient(45deg, #00f2ea, #00b894)',
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
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🔗 Buka di Tab Baru
              </a>
            </div>

            {downloadData.title && (
              <p style={{
                marginTop: '10px',
                color: 'rgba(255, 255, 255, 0.8)',
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
              alignItems: 'center',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <span style={{ color: '#00f2ea' }}>⚡</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                Video sedang didownload otomatis...
              </span>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            color: 'white',
            textAlign: 'center',
            marginBottom: '25px',
            fontSize: isMobile ? '1.3rem' : '1.5rem',
            fontWeight: '600'
          }}>
            🎯 Kenapa Pilih Kami?
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {[
              { icon: '🚀', title: 'Super Cepat', desc: 'Proses download dalam hitungan detik' },
              { icon: '🎨', title: 'HD Quality', desc: 'Video berkualitas tinggi tanpa watermark' },
              { icon: '💯', title: 'Gratis', desc: 'Tanpa biaya, tanpa registrasi' },
              { icon: '📱', title: 'All Devices', desc: 'Bisa di desktop dan mobile' }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                borderRadius: '15px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '10px'
                }}>
                  {feature.icon}
                </div>
                <h4 style={{
                  color: 'white',
                  margin: '0 0 8px 0',
                  fontSize: '1.1rem'
                }}>
                  {feature.title}
                </h4>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0,
                  fontSize: '0.9rem'
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px'
        }}>
          <p>© 2025 TikTok Downloader • Made with ❤️ for content creators</p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
    }
