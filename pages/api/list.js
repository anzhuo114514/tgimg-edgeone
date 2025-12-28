import fs from 'fs-extra';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'images.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (await fs.pathExists(DATA_FILE)) {
      const data = await fs.readJson(DATA_FILE);
      return res.status(200).json(data);
    }
    res.status(200).json([]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read image list', details: error.message });
  }
}
