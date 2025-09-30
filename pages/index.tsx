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
        // Download akan otomatis trigger via useEffect
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
      
      // Validasi URL
      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        setError('URL download tidak valid');
        return;
      }

      const fileExtension = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg';
      const filename = `tiktok-${Date.now()}.${fileExtension}`;

      // Method 1: Fetch dan download blob (LEBIH RELIABLE)
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Create invisible link dan trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      console.log('Auto download completed');

    } catch (err: any) {
      console.error('Auto download error:', err);
      
      // FALLBACK: Buka di tab baru
      console.log('Trying fallback: open in new tab');
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        TikTok Downloader ⚡
      </h1>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Masukkan URL TikTok (vt.tiktok.com, vm.tiktok.com, tiktok.com)"
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
          <button
            onClick={handleDownload}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#ff0050',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? 'Memproses...' : 'Download'}
          </button>
        </div>
        
        {error && (
          <div style={{ 
            background: '#fee', 
            color: '#c33', 
            padding: '10px', 
            borderRadius: '5px',
            marginTop: '10px'
          }}>
            {error}
          </div>
        )}
      </div>

      {downloadData && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>✅ Download Berhasil!</h3>
          
          {downloadData.thumbnail && (
            <div style={{ marginBottom: '15px' }}>
              <img 
                src={downloadData.thumbnail} 
                alt="Thumbnail"
                style={{ 
                  maxWidth: '100%', 
                  borderRadius: '5px',
                  maxHeight: '400px'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => autoDownloadFile(downloadData.url, downloadData.type)}
              style={{
                padding: '10px 20px',
                background: '#00f2ea',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⬇️ Download Ulang
            </button>

            <a
              href={downloadData.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 20px',
                background: '#333',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              🔗 Buka di Tab Baru
            </a>
          </div>

          {downloadData.title && (
            <p style={{ marginTop: '10px', color: '#666', fontStyle: 'italic' }}>
              {downloadData.title}
            </p>
          )}

          <p style={{ marginTop: '10px', color: '#00a000', fontSize: '14px' }}>
            ⚡ Video sedang didownload otomatis...
          </p>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '10px' }}>
        <h4 style={{ color: '#333', marginBottom: '10px' }}>🎯 Fitur:</h4>
        <ul style={{ color: '#666', lineHeight: '1.6' }}>
          <li>✅ <strong>Auto Download</strong> - Langsung download tanpa klik tambahan</li>
          <li>✅ Support semua URL TikTok (vt, vm, tiktok.com)</li>
          <li>✅ Download video tanpa watermark</li>
          <li>✅ Preview thumbnail</li>
        </ul>
      </div>
    </div>
  );
                                        }
