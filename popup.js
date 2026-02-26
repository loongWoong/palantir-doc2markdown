document.addEventListener('DOMContentLoaded', () => {
  const convertBtn = document.getElementById('convertBtn');
  const statusDiv = document.getElementById('status');
  const includeTranslationsCheckbox = document.getElementById('includeTranslations');
  const keepLinksCheckbox = document.getElementById('keepLinks');
  const cssSelectorInput = document.getElementById('cssSelector');
  const markdownPathInput = document.getElementById('markdownPath');
  const imagePathInput = document.getElementById('imagePath');

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
  }

  function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className = 'status';
  }

  async function loadSavedPaths() {
    try {
      const result = await chrome.storage.local.get(['markdownPath', 'imagePath']);
      const defaultPath = 'docs/foundry/Ontology building/';
      
      if (result.markdownPath) {
        markdownPathInput.value = result.markdownPath;
      } else {
        markdownPathInput.value = defaultPath;
      }
      
      if (result.imagePath) {
        imagePathInput.value = result.imagePath;
      } else {
        imagePathInput.value = defaultPath;
      }
    } catch (error) {
      console.warn('Failed to load saved paths:', error);
    }
  }

  async function savePaths() {
    try {
      await chrome.storage.local.set({
        markdownPath: markdownPathInput.value,
        imagePath: imagePathInput.value
      });
    } catch (error) {
      console.warn('Failed to save paths:', error);
    }
  }

  loadSavedPaths();

  markdownPathInput.addEventListener('input', savePaths);
  imagePathInput.addEventListener('input', savePaths);

  function sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  }

  async function downloadMarkdown(markdown, title, savePath, pageUrl) {
    let filename;
    
    if (pageUrl) {
      try {
        const urlObj = new URL(pageUrl);
        const pathParts = urlObj.pathname.split('/').filter(part => part);
        if (pathParts.length > 0) {
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart && lastPart !== '') {
            filename = `${sanitizeFilename(lastPart)}.md`;
          } else if (pathParts.length > 1) {
            filename = `${sanitizeFilename(pathParts[pathParts.length - 2])}.md`;
          }
        }
      } catch (e) {
        console.warn('Failed to parse URL:', e);
      }
    }
    
    if (!filename) {
      filename = `${sanitizeFilename(title)}.md`;
    }
    
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    if (savePath && savePath.trim()) {
      const fullPath = `${savePath.trim()}${filename}`;
      await chrome.downloads.download({
        url: url,
        filename: fullPath,
        saveAs: false
      });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }

  async function downloadImages(images, firstH1Title, imagePath, pageUrl) {
    if (!images || images.length === 0) {
      return;
    }

    const basePath = imagePath ? imagePath.trim() : '';
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        if (!image.data) {
          console.warn(`No image data available for: ${image.url}`);
          continue;
        }
        
        let filename;
        
        const urlParts = image.url.split('/');
        const originalFilename = urlParts[urlParts.length - 1];
        
        if (originalFilename && originalFilename.includes('.')) {
          filename = sanitizeFilename(originalFilename);
          filename = filename.replace(/\.svg$/i, '.png');
        } else {
          const ext = image.alt ? 'png' : 'png';
          const baseName = image.alt ? sanitizeFilename(image.alt) : `image_${i + 1}`;
          filename = `${baseName}.${ext}`;
        }
        
        const fullPath = basePath ? `${basePath}${filename}` : filename;
        
        await chrome.downloads.download({
          url: image.data,
          filename: fullPath,
          saveAs: false
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error downloading image ${image.url}:`, error);
      }
    }
  }

  async function convertToMarkdown() {
    try {
      clearStatus();
      convertBtn.disabled = true;
      showStatus('正在转换...', 'loading');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showStatus('无法获取当前标签页', 'error');
        convertBtn.disabled = false;
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'convertToMarkdown',
        cssSelector: cssSelectorInput.value,
        removeTranslations: !includeTranslationsCheckbox.checked,
        keepLinks: keepLinksCheckbox.checked,
        includeTranslations: includeTranslationsCheckbox.checked
      });

      if (response.success) {
        await downloadMarkdown(response.markdown, response.title, markdownPathInput.value, tab.url);
        
        if (response.images && response.images.length > 0) {
          showStatus('正在下载图片...', 'loading');
          await downloadImages(response.images, response.firstH1Title, imagePathInput.value, tab.url);
        }
        
        showStatus('转换成功！文件已下载', 'success');
      } else {
        showStatus(`转换失败: ${response.error}`, 'error');
      }
    } catch (error) {
      if (error.message.includes('Receiving end does not exist')) {
        showStatus('请刷新页面后重试', 'error');
      } else {
        showStatus(`错误: ${error.message}`, 'error');
      }
    } finally {
      convertBtn.disabled = false;
    }
  }

  convertBtn.addEventListener('click', convertToMarkdown);
});
