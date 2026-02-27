class HTMLToMarkdown {
  constructor(options = {}) {
    this.removeTranslations = options.removeTranslations || false;
    this.keepLinks = options.keepLinks !== false;
    this.includeTranslations = options.includeTranslations || false;
    this.images = [];
  }

  convert(element) {
    if (!element) return '';
    
    const clone = element.cloneNode(true);
    
    if (this.removeTranslations) {
      this.removeTranslationElements(clone);
    }
    
    return this.processNode(clone);
  }

  removeTranslationElements(element) {
    const translationSelectors = [
      '.immersive-translate-target-wrapper',
      '.immersive-translate-target-translation-theme-none',
      '.immersive-translate-target-translation-block-wrapper-theme-none',
      '.immersive-translate-target-translation-block-wrapper',
      '.immersive-translate-target-inner',
      '.immersive-translate-target-translation-theme-none-inner',
      '.immersive-translate-target-translation-inline-wrapper-theme-none',
      '.immersive-translate-target-translation-inline-wrapper',
      '[data-immersive-translate-translation-element-mark]'
    ];
    
    translationSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
  }

  processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const tagName = node.tagName.toLowerCase();
    
    if (this.includeTranslations && this.isTranslationWrapper(node)) {
      return this.processTranslationNode(node);
    }
    
    const children = Array.from(node.childNodes)
      .map(child => this.processNode(child))
      .join('');
    
    switch (tagName) {
      case 'h1':
        return `# ${children.trim()}\n\n`;
      case 'h2':
        return `## ${children.trim()}\n\n`;
      case 'h3':
        return `### ${children.trim()}\n\n`;
      case 'h4':
        return `#### ${children.trim()}\n\n`;
      case 'h5':
        return `##### ${children.trim()}\n\n`;
      case 'h6':
        return `###### ${children.trim()}\n\n`;
      case 'p':
        return `${children.trim()}\n\n`;
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 'code':
        return `\`${children}\``;
      case 'pre':
        return `\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
      case 'a':
        if (this.keepLinks) {
          const href = node.getAttribute('href');
          if (href) {
            return `[${children}](${href})`;
          }
        }
        return children;
      case 'ul':
        return this.processList(node, 'ul');
      case 'ol':
        return this.processList(node, 'ol');
      case 'li':
        return children;
      case 'blockquote':
        return children.split('\n')
          .map(line => line.trim() ? `> ${line}` : '>')
          .join('\n') + '\n\n';
      case 'hr':
        return '---\n\n';
      case 'img':
        const alt = node.getAttribute('alt') || '';
        const src = node.getAttribute('src') || '';
        if (src) {
          const imageData = this.getImageData(src);
          let filename = src.split('/').pop();
          filename = filename.split('?')[0];
          filename = filename.replace(/\.svg$/i, '.png');
          this.images.push({
            url: src,
            alt: alt,
            data: imageData
          });
          return `![${alt}](${filename})\n\n`;
        }
        return '';
      case 'table':
        return this.processTable(node);
      case 'div':
      case 'span':
      case 'section':
      case 'article':
      case 'main':
      case 'header':
      case 'footer':
      case 'nav':
      case 'aside':
      case 'font':
        return children;
      default:
        return children;
    }
  }

  isTranslationWrapper(node) {
    if (!node.classList) return false;
    return node.classList.contains('immersive-translate-target-wrapper') ||
           node.classList.contains('immersive-translate-target-translation-block-wrapper');
  }

  processTranslationNode(node) {
    const translationText = this.extractTranslationText(node);
    const originalText = this.extractOriginalText(node);
    
    if (translationText && originalText) {
      return `${originalText.trim()} ${translationText.trim()}`;
    } else if (translationText) {
      return translationText.trim();
    } else {
      return originalText;
    }
  }

  extractTranslationText(translationNode) {
    const innerWrapper = translationNode.querySelector('.immersive-translate-target-inner');
    if (innerWrapper) {
      return innerWrapper.textContent.trim();
    }
    return '';
  }

  extractOriginalText(node) {
    const clone = node.cloneNode(true);
    const translationElements = clone.querySelectorAll('.immersive-translate-target-wrapper, .immersive-translate-target-inner');
    translationElements.forEach(el => el.remove());
    return clone.textContent.trim();
  }

  processList(node, type) {
    const items = Array.from(node.querySelectorAll(':scope > li'));
    let result = '';
    
    items.forEach((item, index) => {
      const content = Array.from(item.childNodes)
        .map(child => this.processNode(child))
        .join('')
        .trim();
      
      if (type === 'ul') {
        result += `- ${content}\n`;
      } else {
        result += `${index + 1}. ${content}\n`;
      }
      
      const nestedLists = item.querySelectorAll(':scope > ul, :scope > ol');
      nestedLists.forEach(nestedList => {
        const nestedContent = this.processList(nestedList, nestedList.tagName.toLowerCase());
        result += nestedContent.split('\n').map(line => '  ' + line).join('\n');
      });
    });
    
    return result + '\n';
  }

  processTable(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';
    
    const headers = Array.from(rows[0].querySelectorAll('th, td'))
      .map(cell => this.processNode(cell).trim());
    
    let markdown = '| ' + headers.join(' | ') + ' |\n';
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    for (let i = 1; i < rows.length; i++) {
      const cells = Array.from(rows[i].querySelectorAll('td'))
        .map(cell => this.processNode(cell).trim());
      markdown += '| ' + cells.join(' | ') + ' |\n';
    }
    
    return markdown + '\n';
  }

  getImageData(src) {
    try {
      const img = document.querySelector(`img[src="${src}"]`);
      if (img) {
        if (img.complete && img.naturalWidth > 0) {
          if (src.toLowerCase().endsWith('.gif')) {
            const absoluteUrl = new URL(src, window.location.href).href;
            return { url: absoluteUrl, isGif: true };
          }
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          return canvas.toDataURL('image/png');
        } else {
          console.warn(`Image not fully loaded: ${src}`);
        }
      } else {
        console.warn(`Image element not found for src: ${src}`);
      }
    } catch (error) {
      console.warn('Failed to get image data:', error);
    }
    return null;
  }
}

function findMainContent() {
  const body = document.body;
  
  const navigationSelectors = [
    '.ptcom-design__breadcrumbs__1gi647c',
    '.breadcrumbs',
    '[class*="breadcrumb"]',
    '[class*="navigation"]',
    '[class*="nav"]'
  ];
  
  const prevNextSelectors = [
    '[class*="previous"]',
    '[class*="next"]',
    '[class*="pagination"]'
  ];
  
  const clone = body.cloneNode(true);
  
  navigationSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  prevNextSelectors.forEach(selector => {
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  const prevNextTexts = ['PREVIOUS', 'NEXT', 'Previous', 'Next', '上一页', '下一个'];
  const allElements = clone.querySelectorAll('*');
  allElements.forEach(el => {
    const text = el.textContent.trim();
    if (prevNextTexts.some(t => text === t)) {
      el.remove();
    }
  });
  
  const mainContentSelectors = [
    '[data-pagefind-body="true"]',
    'main',
    'article',
    '.content',
    '#content',
    '.main-content',
    '#main-content'
  ];
  
  for (const selector of mainContentSelectors) {
    const element = clone.querySelector(selector);
    if (element) {
      return element;
    }
  }
  
  return clone;
}

function extractFirstH1Title(element) {
  const h1 = element.querySelector('h1');
  if (h1) {
    const text = h1.textContent.trim();
    const anchor = h1.querySelector('a');
    if (anchor) {
      const anchorText = anchor.textContent.trim();
      if (anchorText) {
        return anchorText;
      }
    }
    return text;
  }
  return null;
}

function getMenuTree() {
  const menuSelectors = [
    'nav ul',
    '.sidebar ul',
    '.menu ul',
    '[class*="sidebar"] ul',
    '[class*="menu"] ul',
    '[class*="navigation"] ul'
  ];
  
  function extractParentPath(menuItem) {
    const path = [];
    let currentLi = menuItem.closest('li');
    
    while (currentLi) {
      let parentText = null;
      
      const panelTitle = currentLi.querySelector('[class*="panelTitle"]');
      if (panelTitle) {
        parentText = panelTitle.textContent.trim();
      }
      
      if (!parentText) {
        const headerDiv = currentLi.querySelector('[class*="header"]');
        if (headerDiv) {
          parentText = headerDiv.textContent.trim();
        }
      }
      
      if (!parentText) {
        const button = currentLi.querySelector('button, [role="button"]');
        if (button) {
          parentText = button.textContent.trim();
        }
      }
      
      if (!parentText) {
        const link = currentLi.querySelector('a');
        if (link && link !== menuItem) {
          parentText = link.textContent.trim();
        }
      }
      
      if (parentText && parentText.length > 0 && parentText.length < 100) {
        path.unshift(parentText);
      }
      
      const parentUl = currentLi.parentElement;
      if (parentUl && parentUl.tagName === 'UL') {
        currentLi = parentUl.closest('li');
      } else {
        currentLi = null;
      }
    }
    
    return path;
  }
  
  for (const selector of menuSelectors) {
    const menu = document.querySelector(selector);
    if (menu) {
      const menuItems = menu.querySelectorAll('a, [role="menuitem"], [class*="menu-item"]');
      const items = [];
      
      menuItems.forEach((item, index) => {
        const text = item.textContent.trim();
        const href = item.getAttribute('href');
        const isExpanded = item.getAttribute('aria-expanded') === 'true';
        const isSelected = item.classList.contains('active') || 
                          item.classList.contains('selected') ||
                          item.classList.contains('ptcom-design__isSelected__heuz3') ||
                          item.getAttribute('aria-selected') === 'true';
        
        if (text && href) {
          const path = extractParentPath(item);
          
          items.push({
            index,
            text,
            href,
            isExpanded,
            isSelected,
            path,
            element: item
          });
        }
      });
      
      if (items.length > 0) {
        return items;
      }
    }
  }
  
  return null;
}

function getCurrentMenuItem() {
  const menuItems = getMenuTree();
  if (!menuItems) return null;
  
  return menuItems.find(item => item.isSelected) || menuItems[0];
}

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });
}

function clickMenuItem(menuItem) {
  if (menuItem && menuItem.element) {
    menuItem.element.click();
    return true;
  }
  return false;
}

function waitForPageLoad(timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkLoad = () => {
      if (document.readyState === 'complete') {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        setTimeout(checkLoad, 100);
      }
    };
    
    checkLoad();
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'convertToMarkdown') {
    try {
      const { cssSelector, removeTranslations, keepLinks, includeTranslations } = request;
      
      let element;
      if (cssSelector && cssSelector.trim()) {
        element = document.querySelector(cssSelector);
      } else {
        element = findMainContent();
      }
      
      if (!element) {
        sendResponse({ success: false, error: '未找到指定元素' });
        return;
      }
      
      const converter = new HTMLToMarkdown({
        removeTranslations,
        keepLinks,
        includeTranslations
      });
      
      const markdown = converter.convert(element);
      const title = document.title || 'document';
      const firstH1Title = extractFirstH1Title(element);
      const images = converter.images;
      
      sendResponse({ 
        success: true, 
        markdown, 
        title,
        firstH1Title,
        images
      });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  
  if (request.action === 'getMenuTree') {
    const menuItems = getMenuTree();
    sendResponse({ success: true, menuItems });
  }
  
  if (request.action === 'getCurrentMenuItem') {
    const currentItem = getCurrentMenuItem();
    sendResponse({ success: true, currentItem });
  }
  
  if (request.action === 'scrollToBottom') {
    scrollToBottom();
    sendResponse({ success: true });
  }
  
  if (request.action === 'clickMenuItem') {
    const { index } = request;
    const menuItems = getMenuTree();
    if (menuItems && menuItems[index]) {
      const clicked = clickMenuItem(menuItems[index]);
      sendResponse({ success: clicked });
    } else {
      sendResponse({ success: false, error: 'Menu item not found' });
    }
  }
  
  return true;
});
