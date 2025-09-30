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

// FUNCTION UTAMA YANG SUPPORT SEMUA LINK TIKTOK
async function getTikTokMedia(url: string): Promise<{
  downloadUrl: string;
  thumbnailUrl: string;
  title: string;
  type: 'video' | 'image' | 'audio';
  duration?: number;
}> {
  // NORMALIZE URL - Convert semua short URL ke full URL
  const normalizedUrl = await normalizeTikTokUrl(url);
  
  const apis = [
    // API 1: TikWM (Paling Reliable)
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/`,
      method: 'POST' as const,
      data: { url: normalizedUrl },
      parser: (data: any) => {
        if (data.data && data.data.play) {
          return {
            downloadUrl: `https://www.tikwm.com${data.data.play}`,
            thumbnailUrl: data.data.cover ? `https://www.tikwm.com${data.data.cover}` : '',
            title: data.data.title || 'TikTok Video',
            type: 'video' as const,
            duration: data.data.duration
          };
        }
        return null;
      }
    },
    // API 2: TikTok Downloader API
    {
      name: 'tiktok-downloader',
      url: `https://api.tiktokdownload.org/video/?url=${encodeURIComponent(normalizedUrl)}`,
      method: 'GET' as const,
      parser: (data: any) => {
        if (data.video_url) {
          return {
            downloadUrl: data.video_url,
            thumbnailUrl: data.cover_url || '',
            title: data.title || 'TikTok Video',
            type: 'video' as const,
            duration: data.duration
          };
        }
        return null;
      }
    },
    // API 3: SnapTik
    {
      name: 'snaptik',
      url: `https://snaptik.app/action.php`,
      method: 'POST' as const,
      data: { url: normalizedUrl },
      parser: (data: any) => {
        if (data.url) {
          return {
            downloadUrl: data.url,
            thumbnailUrl: data.thumbnail || '',
            title: data.title || 'TikTok Video',
            type: 'video' as const
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
          'Accept': 'application/json, */*',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      if (api.method === 'POST' && api.data) {
        config.data = new URLSearchParams(api.data);
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

  throw new Error('Semua API gagal. Coba dengan URL TikTok yang berbeda.');
}

// FUNCTION UNTUK NORMALIZE SEMUA JENIS URL TIKTOK
async function normalizeTikTokUrl(url: string): Promise<string> {
  // Jika sudah full URL, return as is
  if (url.includes('tiktok.com/@') && url.includes('/video/')) {
    return url;
  }

  // Convert short URL ke full URL dengan resolve redirect
  if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: null
      });
      
      // Extract final URL dari response
      const finalUrl = response.request?.res?.responseUrl || response.config.url;
      if (finalUrl && finalUrl.includes('tiktok.com/@')) {
        return finalUrl;
      }
    } catch (error: any) {
      console.log('Failed to resolve short URL:', error.message);
    }
  }

  // Fallback - return original URL
  return url;
  }
