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
    // Clean URL
    const cleanUrl = url.trim();
    
    // Use public TikTok downloader APIs
    const result = await getTikTokDownloadUrl(cleanUrl);
    
    if (!result.downloadUrl) {
      return res.status(404).json({ success: false, error: 'Tidak dapat mengambil video dari URL tersebut' });
    }

    res.json({
      success: true,
      data: {
        type: 'video',
        url: result.downloadUrl,
        thumbnail: result.thumbnailUrl,
        title: result.title || 'TikTok Video'
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

// Function to get TikTok download URL using public APIs
async function getTikTokDownloadUrl(url: string): Promise<{downloadUrl: string, thumbnailUrl: string, title: string}> {
  const apis = [
    {
      name: 'tikwm',
      url: `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`,
      parser: (data: any) => {
        if (data.data && data.data.play) {
          return {
            downloadUrl: `https://www.tikwm.com${data.data.play}`,
            thumbnailUrl: data.data.cover ? `https://www.tikwm.com${data.data.cover}` : '',
            title: data.data.title || ''
          };
        }
        return null;
      }
    },
    {
      name: 'tikdown',
      url: `https://api.tikdown.org/download?url=${encodeURIComponent(url)}`,
      parser: (data: any) => {
        if (data.video && data.video.no_watermark) {
          return {
            downloadUrl: data.video.no_watermark,
            thumbnailUrl: data.video.cover || '',
            title: data.video.title || ''
          };
        }
        return null;
      }
    },
    {
      name: 'snaptik',
      url: `https://snaptik.app/action.php?url=${encodeURIComponent(url)}`,
      parser: (data: any) => {
        if (data.url) {
          return {
            downloadUrl: data.url,
            thumbnailUrl: data.thumbnail || '',
            title: data.title || ''
          };
        }
        return null;
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log('Trying API:', api.name);
      const response = await axios.get(api.url, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      const result = api.parser(response.data);
      if (result) {
        console.log('Success with API:', api.name);
        return result;
      }
    } catch (error) {
      console.log(`API ${api.name} failed:`, error);
      continue;
    }
  }

  throw new Error('Semua API gagal mengambil data TikTok');
              }
