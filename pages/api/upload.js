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
      return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set' });
    }

    const { image, caption } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const buffer = Buffer.from(image.split(',')[1], 'base64');
    const form = new FormData();
    form.append('chat_id', CHANNEL_ID);
    form.append('photo', buffer, { filename: 'image.png' });
    if (caption) form.append('caption', caption);

    const sendUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    const resp = await axios.post(sendUrl, form, { headers: form.getHeaders() });

    if (!resp.data.ok) {
      return res.status(500).json({ error: 'Telegram API error', details: resp.data });
    }

    const message = resp.data.result;
    const photo = Array.isArray(message.photo) ? message.photo.pop() : null;
    
    let file_url = null;
    if (photo && photo.file_id) {
      const fileResp = await axios.get(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`
      );
      const file_path = fileResp.data.result && fileResp.data.result.file_path;
      if (file_path) {
        file_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;
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

    res.status(200).json({ ok: true, meta });
  } catch (error) {
    console.error(error);
    const errorMsg = error.response?.data || error.message || 'Upload failed';
    res.status(500).json({ error: 'Upload failed', details: errorMsg });
  }
}
