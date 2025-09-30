import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    // Gunakan API yang lebih reliable
    const result = await getTikTokMedia(cleanUrl);
    
    if (!result.downloadUrl) {
      return res.status(404).json({ success: false, error: 'Tidak dapat mengambil media dari URL tersebut' });
    }

    // Filter berdasarkan media type yang diminta
    let finalResult;
    if (mediaType === 'video') {
      finalResult = {
        type: 'video' as const,
        url: result.downloadUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else if (mediaType === 'audio' && result.audioUrl) {
      finalResult = {
        type: 'audio' as const,
        url: result.audioUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      };
    } else if (mediaType === 'image' && result.thumbnailUrl) {
      finalResult = {
        type: 'image' as const,
        url: result.thumbnailUrl,
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

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan: ' + error.message 
    });
  }
}

// FUNCTION UTAMA - Dapatkan semua media yang available
async function getTikTokMedia(url: string): Promise<{
  downloadUrl: string;
  audioUrl?: string;
  thumbnailUrl: string;
  title: string;
  duration?: number;
}> {
  
  const apis = [
    // API 1: TikWM - Support video, audio, dan images
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/`,
      method: 'POST' as const,
      data: { url: url },
      parser: (data: any) => {
        if (data.data) {
          let downloadUrl = '';
          let audioUrl = '';
          let thumbnailUrl = '';
          
          // Video URL
          if (data.data.play) {
            downloadUrl = data.data.play.startsWith('http') 
              ? data.data.play 
              : `https://www.tikwm.com${data.data.play}`;
          }
          
          // Audio URL
          if (data.data.music) {
            audioUrl = data.data.music.startsWith('http')
              ? data.data.music
              : `https://www.tikwm.com${data.data.music}`;
          }
          
          // Thumbnail URL
          if (data.data.cover) {
            thumbnailUrl = data.data.cover.startsWith('http')
              ? data.data.cover
              : `https://www.tikwm.com${data.data.cover}`;
          }

          if (downloadUrl || audioUrl || thumbnailUrl) {
            return {
              downloadUrl: downloadUrl,
              audioUrl: audioUrl,
              thumbnailUrl: thumbnailUrl,
              title: data.data.title || 'TikTok Video',
              duration: data.data.duration
            };
          }
        }
        return null;
      }
    },
    // API 2: Alternative API
    {
      name: 'snaptik',
      url: `https://snaptik.app/action.php`,
      method: 'POST' as const,
      data: { url: url },
      parser: (data: any) => {
        if (data.url) {
          return {
            downloadUrl: data.url,
            thumbnailUrl: data.thumbnail || '',
            title: data.title || 'TikTok Video',
            duration: data.duration
          };
        }
        return null;
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`Trying API: ${api.name}`);
      
      const config: any = {
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
    } catch (error: any) {
      console.log(`API ${api.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error('Semua API gagal mengambil data TikTok');
}
