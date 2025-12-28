import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/home.module.css';

export default function Home() {
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const res = await fetch('/api/list');
      const data = await res.json();
      setImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('imageInput');
    const file = fileInput.files[0];

    if (!file) {
      alert('请选择图片');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, caption }),
        });

        const result = await res.json();
        if (result.ok) {
          alert('上传成功！');
          fileInput.value = '';
          setCaption('');
          setPreviewUrl(null);
          await loadImages();
        } else {
          alert('上传失败: ' + (result.error || '未知错误'));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传出错');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>EdgeOne Telegram 图床</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mdui@1.0.1/dist/css/mdui.min.css" />
        <style>{`
          body { margin: 0; padding: 0; }
          .mdui-container { max-width: 1200px; margin: 0 auto; padding: 16px; }
          .gallery { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
          .card-img { width: 100%; height: 200px; object-fit: cover; border-radius: 4px; }
          .mdui-card { width: 260px; }
          #preview { max-width: 150px; max-height: 150px; margin-top: 8px; border-radius: 4px; }
        `}</style>
      </Head>

      <body className="mdui-theme-primary-indigo mdui-theme-accent-pink">
        <div className="mdui-container">
          <h2 className="mdui-typo-display-2">Telegram 频道图床（MDUI 卡片）</h2>

          <div className="mdui-card" style={{ marginBottom: '16px' }}>
            <div className="mdui-card-primary">
              <div className="mdui-card-primary-title">上传图片到频道</div>
            </div>
            <div className="mdui-card-content">
              <form onSubmit={handleUpload}>
                <div className="mdui-textfield mdui-textfield-floating-label" style={{ width: '100%' }}>
                  <label className="mdui-textfield-label">图片文件</label>
                  <input
                    id="imageInput"
                    className="mdui-textfield-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                {previewUrl && (
                  <div style={{ marginTop: '8px' }}>
                    <img id="preview" src={previewUrl} alt="preview" />
                  </div>
                )}
                <div className="mdui-textfield mdui-textfield-floating-label" style={{ width: '100%', marginTop: '16px' }}>
                  <label className="mdui-textfield-label">描述（可选）</label>
                  <input
                    id="caption"
                    className="mdui-textfield-input"
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
                <button
                  className="mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme-accent"
                  type="submit"
                  disabled={uploading}
                  style={{ marginTop: '16px' }}
                >
                  {uploading ? '上传中...' : '上传'}
                </button>
              </form>
            </div>
          </div>

          <h3 className="mdui-typo-subheading">图片列表</h3>
          <div className="gallery">
            {images.map((item, idx) => (
              <div key={idx} className="mdui-card">
                <div className="mdui-card-media">
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.caption || '图片'}
                      className="card-img"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: '100%',
                      height: '200px',
                      display: item.url ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#eee',
                      color: '#999',
                      fontSize: '14px',
                    }}
                  >
                    无法加载
                  </div>
                </div>
                <div className="mdui-card-primary">
                  <div className="mdui-card-primary-title">{item.caption || '——'}</div>
                  <div className="mdui-card-primary-subtitle">
                    {new Date(item.date * 1000).toLocaleString()}
                  </div>
                </div>
                <div className="mdui-card-actions">
                  {item.url && (
                    <a className="mdui-btn mdui-ripple" href={item.url} target="_blank" rel="noopener noreferrer">
                      打开原图
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {images.length === 0 && <p style={{ textAlign: 'center', color: '#999', marginTop: '32px' }}>暂无图片</p>}
        </div>

        <script src="https://cdn.jsdelivr.net/npm/mdui@1.0.1/dist/js/mdui.min.js"></script>
      </body>
    </>
  );
}
