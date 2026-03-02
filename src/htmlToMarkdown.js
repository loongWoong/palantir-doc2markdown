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
        return children;
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

  processList(node, type) {
    const items = Array.from(node.children).filter(child => child.tagName.toLowerCase() === 'li');
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
      
      const nestedLists = Array.from(item.children).filter(child => 
        child.tagName.toLowerCase() === 'ul' || child.tagName.toLowerCase() === 'ol'
      );
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
}

export { HTMLToMarkdown }
