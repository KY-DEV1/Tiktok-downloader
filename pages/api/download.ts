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

    // Gunakan API yang benar-benar reliable
    const result = await getTikTokMedia(cleanUrl, mediaType);
    
    if (!result.downloadUrl) {
      return res.status(404).json({ success: false, error: 'Tidak dapat mengambil media dari URL tersebut' });
    }

    res.json({
      success: true,
      data: {
        type: result.type,
        url: result.downloadUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title,
        duration: result.duration
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Terjadi kesalahan: ' + error.message 
    });
  }
}

// FUNCTION UTAMA YANG SUPPORT SEMUA MEDIA TYPE
async function getTikTokMedia(url: string, mediaType: string): Promise<{
  downloadUrl: string;
  thumbnailUrl: string;
  title: string;
  type: 'video' | 'image' | 'audio';
  duration?: number;
}> {
  
  const apis = [
    // API 1: TikWM (Paling Reliable)
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/`,
      method: 'POST' as const,
      data: { url: url },
      parser: (data: any, type: string) => {
        if (data.data) {
          let downloadUrl = '';
          let thumbnailUrl = data.data.cover ? `https://www.tikwm.com${data.data.cover}` : '';
          
          if (type === 'video' && data.data.play) {
            downloadUrl = `https://www.tikwm.com${data.data.play}`;
          } else if (type === 'audio' && data.data.music) {
            downloadUrl = `https://www.tikwm.com${data.data.music}`;
          } else if (type === 'image' && data.data.images) {
            // Untuk images, ambil gambar pertama
            downloadUrl = `https://www.tikwm.com${data.data.images[0]}`;
          }

          if (downloadUrl) {
            return {
              downloadUrl: downloadUrl,
              thumbnailUrl: thumbnailUrl,
              title: data.data.title || 'TikTok Media',
              type: type as 'video' | 'image' | 'audio',
              duration: data.data.duration
            };
          }
        }
        return null;
      }
    },
    // API 2: TikTok Downloader API
    {
      name: 'tiktok-downloader',
      url: `https://api.tiktokdownload.org/video/?url=${encodeURIComponent(url)}`,
      method: 'GET' as const,
      parser: (data: any, type: string) => {
        let downloadUrl = '';
        
        if (type === 'video' && data.video_url) {
          downloadUrl = data.video_url;
        } else if (type === 'audio' && data.music_url) {
          downloadUrl = data.music_url;
        } else if (type === 'image' && data.cover_url) {
          downloadUrl = data.cover_url;
        }

        if (downloadUrl) {
          return {
            downloadUrl: downloadUrl,
            thumbnailUrl: data.cover_url || '',
            title: data.title || 'TikTok Media',
            type: type as 'video' | 'image' | 'audio',
            duration: data.duration
          };
        }
        return null;
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`Trying API: ${api.name} for ${mediaType}`);
      
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
      const result = api.parser(response.data, mediaType);
      
      if (result) {
        console.log(`Success with API: ${api.name}`);
        return result;
      }
    } catch (error: any) {
      console.log(`API ${api.name} failed:`, error.message);
      continue;
    }
  }

  throw new Error(`Tidak dapat mengambil ${mediaType} dari URL tersebut`);
        }
