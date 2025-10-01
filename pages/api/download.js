import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url, mediaType = 'video' } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const cleanUrl = url.trim();
    console.log('Processing URL:', cleanUrl, 'Media type:', mediaType);

    // Coba multiple APIs
    const result = await getTikTokMediaWithFallback(cleanUrl);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tidak dapat mengambil media. Coba dengan URL yang berbeda.' 
      });
    }

    // Process result berdasarkan media type
    let finalResult;
    if (mediaType === 'video') {
      if (!result.downloadUrl) {
        return res.status(404).json({ 
          success: false, 
          error: 'Video tidak tersedia untuk URL ini' 
        });
      }
      finalResult = {
        type: 'video',
        url: result.downloadUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title || 'TikTok Video',
        duration: result.duration
      };
    } 
    else if (mediaType === 'audio') {
      if (!result.audioUrl) {
        return res.status(404).json({ 
          success: false, 
          error: 'Audio tidak tersedia untuk URL ini' 
        });
      }
      finalResult = {
        type: 'audio',
        url: result.audioUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title || 'TikTok Audio',
        duration: result.duration
      };
    } 
    else if (mediaType === 'image') {
      if (!result.images || result.images.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Tidak ada gambar yang ditemukan' 
        });
      }
      finalResult = {
        type: 'image',
        images: result.images,
        thumbnail: result.thumbnailUrl,
        title: result.title || 'TikTok Images',
        duration: result.duration
      };
    }

    res.json({
      success: true,
      data: finalResult
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan server. Coba lagi beberapa saat.' 
    });
  }
}

// Multiple API Fallback System
async function getTikTokMediaWithFallback(url) {
  const apis = [
    // API 1: TikTokDown (Paling Baru)
    {
      name: 'tiktokdown',
      url: `https://www.tikdown.org/api/ajaxSearch`,
      method: 'POST',
      data: { 
        q: url,
        lang: 'id'
      },
      parser: (data) => {
        try {
          if (data.data && (data.data.videos || data.data.images)) {
            let downloadUrl = '';
            let images = [];
            let thumbnailUrl = '';
            
            // Video
            if (data.data.videos && data.data.videos[0]) {
              downloadUrl = data.data.videos[0];
            }
            
            // Images
            if (data.data.images && Array.isArray(data.data.images)) {
              images = data.data.images;
            }
            
            // Thumbnail
            if (data.data.covers && data.data.covers[0]) {
              thumbnailUrl = data.data.covers[0];
            }

            if (downloadUrl || images.length > 0) {
              return {
                downloadUrl: downloadUrl,
                images: images,
                thumbnailUrl: thumbnailUrl,
                title: data.data.title || 'TikTok Media',
                duration: data.data.duration
              };
            }
          }
        } catch (e) {
          console.log('TikTokDown parser error:', e);
        }
        return null;
      }
    },
    // API 2: SnapTik
    {
      name: 'snaptik',
      url: `https://snaptik.app/action.php`,
      method: 'POST',
      data: { url: url },
      parser: (data) => {
        try {
          if (data.url) {
            return {
              downloadUrl: data.url,
              thumbnailUrl: data.thumbnail || '',
              title: data.title || 'TikTok Video',
              duration: data.duration
            };
          }
        } catch (e) {
          console.log('SnapTik parser error:', e);
        }
        return null;
      }
    },
    // API 3: TikWM (Backup)
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/`,
      method: 'POST',
      data: { url: url },
      parser: (data) => {
        try {
          if (data.data) {
            let downloadUrl = '';
            let audioUrl = '';
            let thumbnailUrl = '';
            let images = [];
            
            if (data.data.play) {
              downloadUrl = data.data.play.startsWith('http') 
                ? data.data.play 
                : `https://www.tikwm.com${data.data.play}`;
            }
            
            if (data.data.music) {
              audioUrl = data.data.music.startsWith('http')
                ? data.data.music
                : `https://www.tikwm.com${data.data.music}`;
            }
            
            if (data.data.cover) {
              thumbnailUrl = data.data.cover.startsWith('http')
                ? data.data.cover
                : `https://www.tikwm.com${data.data.cover}`;
            }

            if (data.data.images && Array.isArray(data.data.images)) {
              images = data.data.images.map((img) => 
                img.startsWith('http') ? img : `https://www.tikwm.com${img}`
              );
            }

            if (downloadUrl || audioUrl || thumbnailUrl || images.length > 0) {
              return {
                downloadUrl: downloadUrl,
                audioUrl: audioUrl,
                thumbnailUrl: thumbnailUrl,
                images: images,
                title: data.data.title || 'TikTok Video',
                duration: data.data.duration
              };
            }
          }
        } catch (e) {
          console.log('TikWM parser error:', e);
        }
        return null;
      }
    },
    // API 4: SSSTik (Backup)
    {
      name: 'ssstik',
      url: `https://ssstik.io/abc?url=dl`,
      method: 'POST',
      data: { 
        id: url,
        locale: 'id',
        tt: 'aGV5'
      },
      parser: (data) => {
        try {
          // Parse HTML response dari SSSTik
          if (data.includes('download without watermark')) {
            const urlMatch = data.match(/href="([^"]*download[^"]*)"/);
            if (urlMatch && urlMatch[1]) {
              return {
                downloadUrl: urlMatch[1].startsWith('http') ? urlMatch[1] : `https://ssstik.io${urlMatch[1]}`,
                title: 'TikTok Video'
              };
            }
          }
        } catch (e) {
          console.log('SSSTik parser error:', e);
        }
        return null;
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`🔄 Trying API: ${api.name}`);
      
      const config = {
        method: api.method,
        url: api.url,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://www.tiktok.com',
          'Referer': 'https://www.tiktok.com/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site'
        }
      };

      if (api.method === 'POST') {
        if (api.url.includes('tikdown.org')) {
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
          config.headers['X-Requested-With'] = 'XMLHttpRequest';
          config.data = new URLSearchParams(api.data);
        } else {
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          config.data = new URLSearchParams(api.data);
        }
      }

      const response = await axios(config);
      console.log(`✅ API ${api.name} response received`);
      
      const result = api.parser(response.data);
      
      if (result) {
        console.log(`🎉 Success with API: ${api.name}`);
        return result;
      }
    } catch (error) {
      console.log(`❌ API ${api.name} failed:`, error.message);
      continue;
    }
  }

  console.log('❌ All APIs failed');
  return null;
      }
