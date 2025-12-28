async function fetchList() {
  const res = await fetch('/list');
  const data = await res.json();
  return data;
}

function renderCard(item) {
  const div = document.createElement('div');
  div.className = 'mdui-card';
  div.style.width = '260px';
  div.innerHTML = `
    <div class="mdui-card-media">
      <img src="${item.url || '#'}" class="card-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'260\' height=\'160\'><rect width=\'100%\' height=\'100%\' fill=\'%23eee\'/><text x=\'50%\' y=\'50%\' fill=\'%23999\' font-size=\'14\' text-anchor=\'middle\' alignment-baseline=\'middle\'>无法加载</text></svg>'"/>
    </div>
    <div class="mdui-card-primary">
      <div class="mdui-card-primary-title">${item.caption || '——'}</div>
      <div class="mdui-card-primary-subtitle">${new Date(item.date*1000).toLocaleString()}</div>
    </div>
    <div class="mdui-card-actions">
      <a class="mdui-btn mdui-ripple" href="${item.url}" target="_blank">打开原图</a>
    </div>
  `;
  return div;
}

async function loadGallery(){
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  const list = await fetchList();
  list.forEach(i => gallery.appendChild(renderCard(i)));
}

document.getElementById('uploadForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fileInput = document.getElementById('imageInput');
  if (!fileInput.files.length) return mdui.snackbar('请选择图片');
  const f = fileInput.files[0];
  const caption = document.getElementById('caption').value || '';
  const fd = new FormData();
  fd.append('image', f);
  fd.append('caption', caption);
  const btn = e.submitter || null;
  if (btn) btn.disabled = true;
  try{
    const res = await fetch('/upload', { method: 'POST', body: fd });
    const j = await res.json();
    if (j.ok) {
      mdui.snackbar('上传成功');
      fileInput.value = '';
      document.getElementById('caption').value = '';
      await loadGallery();
    } else {
      mdui.snackbar('上传失败');
      console.error(j);
    }
  }catch(err){
    console.error(err);
    mdui.snackbar('上传出错');
  }finally{
    if (btn) btn.disabled = false;
  }
});

loadGallery();
