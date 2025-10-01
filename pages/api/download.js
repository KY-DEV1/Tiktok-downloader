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

    const result = await getTikTokMedia(cleanUrl);
    
    if (!result.downloadUrl && mediaType === 'video') {
      return res.status(404).json({ success: false, error: 'Tidak dapat mengambil media dari URL tersebut' });
    }

    if (mediaType === 'image' && (!result.images || result.images.length === 0)) {
      return res.status(404).json({ success: false, error: 'Tidak ada gambar yang ditemukan' });
    }

    let finalResult;
    if (mediaType === 'video') {
      finalResult = {
        type: 'video',
        url: result.downloadUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else if (mediaType === 'audio' && result.audioUrl) {
      finalResult = {
        type: 'audio',
        url: result.audioUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else if (mediaType === 'image') {
      finalResult = {
        type: 'image',
        images: result.images || [],
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `Media type ${mediaType} tidak tersedia untuk video ini` 
      });
    }

    res.json({
      success: true,
      data: finalResult
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan: ' + error.message 
    });
  }
}

async function getTikTokMedia(url) {
  const apis = [
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/`,
      method: 'POST',
      data: { url: url },
      parser: (data) => {
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
        return null;
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`Trying API: ${api.name}`);
      
      const config = {
        method: api.method,
        url: api.url,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, */*'
        }
      };

      if (api.method === 'POST' && api.data) {
        config.data = new URLSearchParams(api.data);
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const response = await axios(config);
      const result = api.parser(response.data);
      
      if (result) {
        console.log(`Success with API: ${api.name}`);
        return result;
      }
    } catch (error) {
      console.log(`API ${api.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('Semua API gagal mengambil data TikTok');
        }
