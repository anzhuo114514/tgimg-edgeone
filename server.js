const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const fs = require('fs-extra');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage() });
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'images.json');
fs.ensureDirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) fs.writeJsonSync(DATA_FILE, []);

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
if (!BOT_TOKEN || !CHANNEL_ID) {
  console.warn('警告: 请设置环境变量 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHANNEL_ID');
}

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });
    const caption = req.body.caption || '';
    const form = new FormData();
    form.append('chat_id', CHANNEL_ID);
    form.append('photo', req.file.buffer, { filename: req.file.originalname });
    if (caption) form.append('caption', caption);

    const sendUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    const resp = await axios.post(sendUrl, form, { headers: form.getHeaders() });
    const message = resp.data.result;
    const photo = Array.isArray(message.photo) ? message.photo.pop() : null;
    let file_url = null;
    if (photo && photo.file_id) {
      const fileResp = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`);
      const file_path = fileResp.data.result && fileResp.data.result.file_path;
      if (file_path) file_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${file_path}`;
    }

    const meta = {
      message_id: message.message_id,
      file_id: photo ? photo.file_id : null,
      file_unique_id: photo ? photo.file_unique_id : null,
      url: file_url,
      caption,
      date: message.date
    };
    const arr = fs.readJsonSync(DATA_FILE);
    arr.unshift(meta);
    fs.writeJsonSync(DATA_FILE, arr);
    res.json({ ok: true, meta });
  } catch (e) {
    console.error(e.response && e.response.data ? e.response.data : e.message ? e.message : e);
    res.status(500).json({ error: e.message || 'upload failed' });
  }
});

app.get('/list', (req, res) => {
  const arr = fs.readJsonSync(DATA_FILE);
  res.json(arr);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
