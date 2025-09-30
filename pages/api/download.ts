import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    const cleanUrl = url.trim();
    console.log('Processing URL:', cleanUrl);

    // Gunakan API yang benar-benar reliable
    const result = await getTikTokMedia(cleanUrl);
    
    if (!result.downloadUrl) {
      return res.status(404).json({ success: false, error: 'Tidak dapat mengambil media dari URL tersebut' });
    }

    // VALIDASI URL sebelum dikirim
    if (!isValidUrl(result.downloadUrl)) {
      return res.status(400).json({ success: false, error: 'URL download tidak valid' });
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

// Helper function untuk validasi URL
function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// FUNCTION UTAMA YANG SUPPORT SEMUA LINK TIKTOK
async function getTikTokMedia(url: string): Promise<{
  downloadUrl: string;
  thumbnailUrl: string;
  title: string;
  type: 'video' | 'image' | 'audio';
  duration?: number;
}> {
  
  const apis = [
    // API 1: TikWM (Paling Reliable) - FIXED URL
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/`,
      method: 'POST' as const,
      data: { url: url },
      parser: (data: any) => {
        if (data.data && data.data.play) {
          const downloadUrl = data.data.play.startsWith('http') 
            ? data.data.play 
            : `https://www.tikwm.com${data.data.play}`;
            
          const thumbnailUrl = data.data.cover 
            ? (data.data.cover.startsWith('http') 
                ? data.data.cover 
                : `https://www.tikwm.com${data.data.cover}`)
            : '';

          return {
            downloadUrl: downloadUrl,
            thumbnailUrl: thumbnailUrl,
            title: data.data.title || 'TikTok Video',
            type: 'video' as const,
            duration: data.data.duration
          };
        }
        return null;
      }
    },
    // API 2: TikTokDL - Alternative API
    {
      name: 'tikodl',
      url: `https://api.tikodl.com/video/?url=${encodeURIComponent(url)}`,
      method: 'GET' as const,
      parser: (data: any) => {
        if (data.video && data.video.noWatermark) {
          return {
            downloadUrl: data.video.noWatermark,
            thumbnailUrl: data.video.cover || '',
            title: data.video.title || 'TikTok Video',
            type: 'video' as const,
            duration: data.video.duration
          };
        }
        return null;
      }
    },
    // API 3: Simple TikTok API
    {
      name: 'simpletk',
      url: `https://tiktok-video-no-watermark2.p.rapidapi.com/`,
      method: 'GET' as const,
      params: {
        url: url,
        hd: '1'
      },
      headers: {
        'X-RapidAPI-Key': 'demo-key', // Free tier
        'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
      },
      parser: (data: any) => {
        if (data.data && data.data.play) {
          return {
            downloadUrl: data.data.play,
            thumbnailUrl: data.data.cover || '',
            title: data.data.title || 'TikTok Video',
            type: 'video' as const,
            duration: data.data.duration
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

      // Tambahkan headers khusus jika ada
      if (api.headers) {
        config.headers = { ...config.headers, ...api.headers };
      }

      // Tambahkan params untuk GET atau data untuk POST
      if (api.method === 'GET' && api.params) {
        config.params = api.params;
      } else if (api.method === 'POST' && api.data) {
        config.data = new URLSearchParams(api.data);
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const response = await axios(config);
      const result = api.parser(response.data);
      
      if (result && isValidUrl(result.downloadUrl)) {
        console.log(`Success with API: ${api.name}`);
        return result;
      }
    } catch (error: any) {
      console.log(`API ${api.name} failed:`, error.message);
      continue;
    }
  }

  // FALLBACK: Gunakan service langsung
  try {
    const fallbackUrl = await getFallbackDownload(url);
    if (fallbackUrl) {
      return {
        downloadUrl: fallbackUrl,
        thumbnailUrl: '',
        title: 'TikTok Video',
        type: 'video' as const
      };
    }
  } catch (error) {
    console.log('Fallback also failed');
  }

  throw new Error('Tidak dapat mengambil video. Coba dengan URL yang berbeda.');
}

// FALLBACK METHOD untuk cases emergency
async function getFallbackDownload(url: string): Promise<string | null> {
  try {
    // Method 1: Direct dari TikTok
    const response = await axios.get(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (response.data && response.data.html) {
      // Extract video ID dari HTML
      const videoIdMatch = response.data.html.match(/video\/(\d+)/);
      if (videoIdMatch) {
        return `https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`;
      }
    }
  } catch (error) {
    console.log('Fallback method failed');
  }
  return null;
      }
