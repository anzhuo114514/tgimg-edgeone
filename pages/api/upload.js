import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'images.json');

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

async function ensureDataDir() {
  await fs.ensureDir(DATA_DIR);
  if (!await fs.pathExists(DATA_FILE)) {
    await fs.writeJson(DATA_FILE, []);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!BOT_TOKEN || !CHANNEL_ID) {
      console.error('[Upload API] Missing env vars - BOT_TOKEN:', !!BOT_TOKEN, 'CHANNEL_ID:', !!CHANNEL_ID);
      return res.status(500).json({ 
        error: '缺少必要的环境变量',
        details: 'TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHANNEL_ID 未设置'
      });
    }

    const { image, caption } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: '未提供图片' });
    }

    // 处理 base64 格式: "data:image/png;base64,xxxxx" 或直接 "xxxxx"
    let base64Data = image;
    if (image.includes(',')) {
      base64Data = image.split(',')[1];
    }

    if (!base64Data) {
      return res.status(400).json({ error: 'base64 数据无效' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: '解析图片失败，缓冲区为空' });
    }

    console.log(`[Upload API] Uploading image: ${buffer.length} bytes, channel: ${CHANNEL_ID}`);

    const form = new FormData();
    form.append('chat_id', CHANNEL_ID);
    form.append('photo', buffer, { filename: 'image.png' });
    if (caption) form.append('caption', caption);

    const sendUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    console.log(`[Upload API] Sending to Telegram: ${sendUrl}`);
    
    const resp = await axios.post(sendUrl, form, { 
      headers: form.getHeaders(),
      timeout: 30000 
    });

    console.log('[Upload API] Telegram response:', resp.data.ok);

    if (!resp.data.ok) {
      console.error('[Upload API] Telegram error:', resp.data);
      return res.status(500).json({ 
        error: 'Telegram API 错误',
        details: resp.data.description || resp.data
      });
    }

    const message = resp.data.result;
    const photo = Array.isArray(message.photo) ? message.photo.pop() : null;
    
    let file_url = null;
    if (photo && photo.file_id) {
      try {
        const fileResp = await axios.get(
          `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`,
          { timeout: 10000 }
        );
        const file_path = fileResp.data.result && fileResp.data.result.file_path;
        if (file_path) {
          file_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;
        }
      } catch (err) {
        console.error('[Upload API] Error getting file URL:', err.message);
      }
    }

    const meta = {
      message_id: message.message_id,
      file_id: photo ? photo.file_id : null,
      file_unique_id: photo ? photo.file_unique_id : null,
      url: file_url,
      caption: caption || '',
      date: message.date,
      timestamp: new Date().toISOString(),
    };

    await ensureDataDir();
    const arr = await fs.readJson(DATA_FILE);
    arr.unshift(meta);
    await fs.writeJson(DATA_FILE, arr);

    console.log('[Upload API] Success, saved meta:', meta.message_id);
    res.status(200).json({ ok: true, meta });
  } catch (error) {
    console.error('[Upload API] Error occurred:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      stack: error.stack
    });

    let errorMsg = '上传失败';
    let details = error.message;

    if (error.response?.data?.description) {
      details = error.response.data.description;
    } else if (error.code === 'ECONNREFUSED') {
      errorMsg = '网络连接失败';
      details = '无法连接到 Telegram 服务器，请检查网络连接';
    } else if (error.code === 'ETIMEDOUT') {
      errorMsg = '请求超时';
      details = '连接到 Telegram 超时，请稍后重试';
    } else if (error.response?.status === 400) {
      errorMsg = 'Bad Request';
      details = error.response.data.description || '请求参数无效';
    } else if (error.response?.status === 401) {
      errorMsg = 'Unauthorized';
      details = 'Bot Token 无效或已过期';
    }

    res.status(error.response?.status || 500).json({ 
      error: errorMsg,
      details: details,
      timestamp: new Date().toISOString()
    });
  }
}
