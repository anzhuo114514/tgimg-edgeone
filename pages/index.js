import React, { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const runDiagnostic = async () => {
    setDiagnosticLoading(true);
    try {
      const res = await fetch('/api/test');
      const data = await res.json();
      setDiagnosticResult(data);
    } catch (error) {
      setDiagnosticResult({ error: '诊断请求失败: ' + error.message });
    } finally {
      setDiagnosticLoading(false);
    }
  };

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

    // 检查文件大小（Telegram 限制 50MB）
    if (file.size > 50 * 1024 * 1024) {
      alert('文件过大，请选择小于 50MB 的图片');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target.result;
          console.log('[Upload] Starting upload, file size:', file.size, 'bytes');
          
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, caption }),
          });

          console.log('[Upload] Response status:', res.status);
          const result = await res.json();
          console.log('[Upload] Response data:', result);

          if (result.ok) {
            alert('上传成功！');
            fileInput.value = '';
            setCaption('');
            setPreviewUrl(null);
            await loadImages();
          } else {
            console.error('Upload failed:', result);
            const errorMsg = result.details ? `${result.error}: ${result.details}` : (result.error || '未知错误');
            alert('上传失败\n' + errorMsg);
          }
        } catch (innerError) {
          console.error('Upload processing error:', innerError);
          alert('处理响应失败: ' + innerError.message);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        console.error('FileReader error');
        alert('读取文件失败');
        setUploading(false);
      };
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          console.log('[Upload] Reading progress:', percentComplete.toFixed(2) + '%');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传出错: ' + error.message);
      setUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Telegram 频道图床 (MDUI 卡片)</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mdui@1.0.1/dist/css/mdui.min.css" />
        <style>{`
          * { margin: 0; padding: 0; }
          html, body { width: 100%; height: 100%; }
          body { font-family: Roboto, sans-serif; }
          .page-container { padding: 20px; max-width: 1400px; margin: 0 auto; }
          .upload-card { margin-bottom: 24px; }
          .form-group { margin-bottom: 16px; }
          .form-group label { display: block; font-size: 14px; margin-bottom: 8px; color: #333; }
          .form-group input[type="file"], 
          .form-group input[type="text"] { 
            width: 100%; 
            padding: 8px 12px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            font-size: 14px;
            box-sizing: border-box;
          }
          .form-group input[type="file"]:focus, 
          .form-group input[type="text"]:focus { 
            outline: none; 
            border-color: #2196F3; 
            background-color: #f5f5f5;
          }
          .preview-img { max-width: 150px; max-height: 150px; margin-top: 8px; border-radius: 4px; border: 1px solid #ddd; }
          .btn-upload { background-color: #E91E63; color: white; border: none; padding: 10px 24px; border-radius: 2px; cursor: pointer; font-size: 14px; font-weight: 500; }
          .btn-upload:hover { background-color: #C2185B; }
          .btn-upload:disabled { background-color: #ccc; cursor: not-allowed; }
          .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 24px; }
          .gallery-card { border: 1px solid #e0e0e0; border-radius: 2px; overflow: hidden; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .gallery-card-media { width: 100%; height: 180px; background: #f5f5f5; overflow: hidden; display: flex; align-items: center; justify-content: center; }
          .gallery-card-media img { width: 100%; height: 100%; object-fit: cover; }
          .gallery-card-media .no-image { color: #999; font-size: 12px; }
          .gallery-card-primary { padding: 12px; }
          .gallery-card-title { font-weight: 500; font-size: 14px; margin-bottom: 4px; color: #333; }
          .gallery-card-subtitle { font-size: 12px; color: #999; }
          .gallery-card-actions { padding: 8px 12px; border-top: 1px solid #f0f0f0; }
          .gallery-card-actions a { color: #2196F3; text-decoration: none; font-size: 13px; display: inline-block; }
          .gallery-card-actions a:hover { text-decoration: underline; }
          .no-images { text-align: center; color: #999; padding: 40px 20px; font-size: 14px; }
          h1 { font-size: 28px; font-weight: 400; margin-bottom: 24px; color: #333; }
          h2 { font-size: 18px; font-weight: 500; margin-bottom: 16px; margin-top: 24px; color: #333; }
          .diagnostic-btn { background-color: #666; color: white; border: none; padding: 6px 12px; border-radius: 2px; cursor: pointer; font-size: 12px; margin-left: auto; display: block; }
          .diagnostic-btn:hover { background-color: #555; }
          .diagnostic-panel { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 16px; margin-bottom: 20px; }
          .diagnostic-success { border-left: 4px solid #4CAF50; }
          .diagnostic-error { border-left: 4px solid #f44336; }
          .diagnostic-warning { border-left: 4px solid #ff9800; }
          .diagnostic-code { background: white; border: 1px solid #ddd; border-radius: 2px; padding: 12px; font-family: monospace; font-size: 12px; max-height: 300px; overflow: auto; margin-top: 12px; }
          .diagnostic-item { margin-bottom: 8px; font-size: 13px; }
        `}</style>
      </Head>

      <div className="mdui-theme-primary-indigo mdui-theme-accent-pink" style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ margin: 0 }}>Telegram 频道图床 (MDUI 卡片)</h1>
            <button className="diagnostic-btn" onClick={() => setShowDiagnostic(!showDiagnostic)}>
              {showDiagnostic ? '隐藏诊断' : '显示诊断'}
            </button>
          </div>

          {showDiagnostic && (
            <div className={`diagnostic-panel ${diagnosticResult?.ok ? 'diagnostic-success' : 'diagnostic-error'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 12px 0' }}>配置诊断</h3>
                <button className="diagnostic-btn" onClick={runDiagnostic} disabled={diagnosticLoading}>
                  {diagnosticLoading ? '检测中...' : '运行检测'}
                </button>
              </div>
              
              {diagnosticResult ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <strong>{diagnosticResult.ok ? '✓ 配置正确' : '✗ 配置错误'}</strong>
                    {diagnosticResult.message && <p style={{ margin: '4px 0 0 0' }}>{diagnosticResult.message}</p>}
                    {diagnosticResult.error && <p style={{ margin: '4px 0 0 0', color: '#f44336' }}>{diagnosticResult.error}</p>}
                  </div>
                  
                  {diagnosticResult.checks && (
                    <div style={{ marginBottom: 12 }}>
                      {Object.entries(diagnosticResult.checks).map(([key, value]) => (
                        <div key={key} className="diagnostic-item">
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {diagnosticResult.details && (
                    <div className="diagnostic-item" style={{ color: '#f44336' }}>
                      错误信息: {diagnosticResult.details}
                    </div>
                  )}
                  
                  {diagnosticResult.help && (
                    <div className="diagnostic-code">
                      {diagnosticResult.help}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#666', margin: 0 }}>点击"运行检测"按钮来诊断配置</p>
              )}
            </div>
          )}

          {/* 上传卡片 */}
          <div className="mdui-card upload-card">
            <div className="mdui-card-primary">
              <div className="mdui-card-primary-title">上传图片到频道</div>
            </div>
            <div className="mdui-card-content">
              <form onSubmit={handleUpload}>
                <div className="form-group">
                  <label>图片文件 <span style={{ color: '#E91E63' }}>*</span></label>
                  <input
                    id="imageInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                  />
                </div>

                {previewUrl && (
                  <div className="form-group">
                    <img src={previewUrl} alt="preview" className="preview-img" />
                  </div>
                )}

                <div className="form-group">
                  <label>描述 (可选)</label>
                  <input
                    type="text"
                    placeholder="输入图片描述或标题..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-upload"
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '上传'}
                </button>
              </form>
            </div>
          </div>

          {/* 图片列表 */}
          <h2>图片列表</h2>
          {images.length > 0 ? (
            <div className="gallery">
              {images.map((item, idx) => (
                <div key={idx} className="gallery-card">
                  <div className="gallery-card-media">
                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.caption || '图片'}
                      />
                    ) : (
                      <div className="no-image">无法加载</div>
                    )}
                  </div>
                  <div className="gallery-card-primary">
                    <div className="gallery-card-title">{item.caption || '(无标题)'}</div>
                    <div className="gallery-card-subtitle">
                      {new Date(item.date * 1000).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  {item.url && (
                    <div className="gallery-card-actions">
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        打开原图 →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-images">暂无图片，上传第一张吧！</div>
          )}
        </div>
      </div>

      <script src="https://cdn.jsdelivr.net/npm/mdui@1.0.1/dist/js/mdui.min.js" />
    </>
  );
}
