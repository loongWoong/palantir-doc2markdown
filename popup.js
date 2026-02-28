document.addEventListener('DOMContentLoaded', () => {
  const convertBtn = document.getElementById('convertBtn');
  const autoCollectBtn = document.getElementById('autoCollectBtn');
  const statusDiv = document.getElementById('status');
  const includeTranslationsCheckbox = document.getElementById('includeTranslations');
  const keepLinksCheckbox = document.getElementById('keepLinks');
  const cssSelectorInput = document.getElementById('cssSelector');
  const savePathInput = document.getElementById('savePath');
  const waitTimeInput = document.getElementById('waitTime');
  
  let isAutoCollecting = false;
  let stopAutoCollect = false;
  let downloadedImages = new Set();

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
      const result = await chrome.storage.local.get(['savePath', 'waitTime']);
      const defaultPath = 'docs/foundry/';
      
      if (result.savePath) {
        savePathInput.value = result.savePath;
      } else {
        savePathInput.value = defaultPath;
      }
      
      if (result.waitTime) {
        waitTimeInput.value = result.waitTime;
      }
    } catch (error) {
      console.warn('Failed to load saved paths:', error);
    }
  }

  async function savePaths() {
    try {
      await chrome.storage.local.set({
        savePath: savePathInput.value,
        waitTime: waitTimeInput.value
      });
    } catch (error) {
      console.warn('Failed to save paths:', error);
    }
  }

  loadSavedPaths();

  savePathInput.addEventListener('input', savePaths);
  waitTimeInput.addEventListener('input', savePaths);

  function sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  }

  async function downloadMarkdown(markdown, title, savePath, pageUrl, menuPath, firstH1Title) {
    let filename;
    let subPath = '';
    
    if (menuPath && menuPath.length > 0) {
      subPath = menuPath.map(p => sanitizeFilename(p)).join('/') + '/';
    }
    
    if (firstH1Title) {
      filename = `${sanitizeFilename(firstH1Title)}.md`;
    } else if (pageUrl) {
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
      const fullPath = `${savePath.trim()}${subPath}${filename}`;
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

  async function downloadImages(images, firstH1Title, imagePath, pageUrl, menuPath) {
    if (!images || images.length === 0) {
      return;
    }

    let basePath = imagePath ? imagePath.trim() : '';
    
    if (menuPath && menuPath.length > 0) {
      basePath += menuPath.map(p => sanitizeFilename(p)).join('/') + '/';
    }
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      try {
        if (!image.data) {
          console.warn(`No image data available for: ${image.url}`);
          continue;
        }
        
        if (downloadedImages.has(image.url)) {
          console.log(`Image already downloaded: ${image.url}`);
          continue;
        }
        
        let filename;
        let downloadUrl;
        
        const urlParts = image.url.split('/');
        const originalFilename = urlParts[urlParts.length - 1];
        
        if (originalFilename && originalFilename.includes('.')) {
          filename = originalFilename.split('?')[0];
          filename = sanitizeFilename(filename);
          if (!filename.toLowerCase().endsWith('.gif')) {
            filename = filename.replace(/\.svg$/i, '.png');
          }
        } else {
          const ext = image.alt ? 'png' : 'png';
          const baseName = image.alt ? sanitizeFilename(image.alt) : `image_${i + 1}`;
          filename = `${baseName}.${ext}`;
        }
        
        const fullPath = basePath ? `${basePath}${filename}` : filename;
        
        if (image.data && typeof image.data === 'object' && image.data.isGif) {
          downloadUrl = image.data.url;
        } else {
          downloadUrl = image.data;
        }
        
        await chrome.downloads.download({
          url: downloadUrl,
          filename: fullPath,
          saveAs: false
        });
        
        downloadedImages.add(image.url);
        
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

      const currentResponse = await chrome.tabs.sendMessage(tab.id, {
        action: 'getCurrentMenuItem'
      });

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'convertToMarkdown',
        cssSelector: cssSelectorInput.value,
        removeTranslations: !includeTranslationsCheckbox.checked,
        keepLinks: keepLinksCheckbox.checked,
        includeTranslations: includeTranslationsCheckbox.checked
      });

      if (response.success) {
        const menuPath = currentResponse.success && currentResponse.currentItem ? currentResponse.currentItem.path : [];
        await downloadMarkdown(response.markdown, response.title, savePathInput.value, tab.url, menuPath, response.firstH1Title);
        
        if (response.images && response.images.length > 0) {
          showStatus('正在下载图片...', 'loading');
          await downloadImages(response.images, response.firstH1Title, savePathInput.value, tab.url, menuPath);
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
  
  async function autoCollect() {
    if (isAutoCollecting) {
      stopAutoCollect = true;
      autoCollectBtn.textContent = '自动采集';
      showStatus('正在停止...', 'loading');
      return;
    }
    
    try {
      isAutoCollecting = true;
      stopAutoCollect = false;
      downloadedImages.clear();
      autoCollectBtn.textContent = '停止采集';
      convertBtn.disabled = true;
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showStatus('无法获取当前标签页', 'error');
        return;
      }
      
      const menuResponse = await chrome.tabs.sendMessage(tab.id, {
        action: 'getMenuTree'
      });
      
      if (!menuResponse.success || !menuResponse.menuItems || menuResponse.menuItems.length === 0) {
        showStatus('未找到菜单树', 'error');
        return;
      }
      
      const menuItems = menuResponse.menuItems;
      let startIndex = 0;
      
      const currentResponse = await chrome.tabs.sendMessage(tab.id, {
        action: 'getCurrentMenuItem'
      });
      
      if (currentResponse.success && currentResponse.currentItem) {
        startIndex = currentResponse.currentItem.index;
      }
      
      showStatus(`开始自动采集，共 ${menuItems.length} 个页面`, 'loading');
      
      for (let i = startIndex; i < menuItems.length; i++) {
        if (stopAutoCollect) {
          showStatus('采集已停止', 'error');
          break;
        }
        
        const menuItem = menuItems[i];
        showStatus(`[进度 ${i + 1}/${menuItems.length}] 正在处理: ${menuItem.text}`, 'loading');
        
        await chrome.tabs.sendMessage(tab.id, {
          action: 'scrollToBottom'
        });
        
        const waitTime = parseInt(waitTimeInput.value) || 10;
        for (let countdown = waitTime; countdown > 0; countdown--) {
          if (stopAutoCollect) {
            break;
          }
          showStatus(`[进度 ${i + 1}/${menuItems.length}] 等待翻译加载: ${countdown}秒`, 'loading');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (stopAutoCollect) {
          showStatus('采集已停止', 'error');
          break;
        }
        
        const convertResponse = await chrome.tabs.sendMessage(tab.id, {
          action: 'convertToMarkdown',
          cssSelector: cssSelectorInput.value,
          removeTranslations: !includeTranslationsCheckbox.checked,
          keepLinks: keepLinksCheckbox.checked,
          includeTranslations: includeTranslationsCheckbox.checked
        });
        
        if (convertResponse.success) {
          const currentTab = await chrome.tabs.get(tab.id);
          const menuPath = menuItem.path || [];
          await downloadMarkdown(convertResponse.markdown, convertResponse.title, savePathInput.value, currentTab.url, menuPath, convertResponse.firstH1Title);
          
          if (convertResponse.images && convertResponse.images.length > 0) {
            await downloadImages(convertResponse.images, convertResponse.firstH1Title, savePathInput.value, currentTab.url, menuPath);
          }
        }
        
        if (i < menuItems.length - 1 && !stopAutoCollect) {
          const nextIndex = i + 1;
          const clickResponse = await chrome.tabs.sendMessage(tab.id, {
            action: 'clickMenuItem',
            index: nextIndex
          });
          
          if (clickResponse.success) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      if (!stopAutoCollect) {
        showStatus(`自动采集完成！共处理 ${menuItems.length - startIndex} 个页面`, 'success');
      }
    } catch (error) {
      if (error.message.includes('Receiving end does not exist')) {
        showStatus('请刷新页面后重试', 'error');
      } else {
        showStatus(`错误: ${error.message}`, 'error');
      }
    } finally {
      isAutoCollecting = false;
      stopAutoCollect = false;
      autoCollectBtn.textContent = '自动采集';
      convertBtn.disabled = false;
    }
  }
  
  autoCollectBtn.addEventListener('click', autoCollect);
  
  document.addEventListener('keydown', (event) => {
    if (event.altKey) {
      if (event.key === 'q' || event.key === 'Q') {
        event.preventDefault();
        if (!convertBtn.disabled) {
          convertToMarkdown();
        }
      } else if (event.key === 'w' || event.key === 'W') {
        event.preventDefault();
        autoCollect();
      }
    }
  });
});
