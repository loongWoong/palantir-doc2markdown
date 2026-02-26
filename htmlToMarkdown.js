class HTMLToMarkdown {
  constructor(options = {}) {
    this.removeTranslations = options.removeTranslations || false;
    this.keepLinks = options.keepLinks !== false;
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
          return `![${alt}](${src})\n\n`;
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
}
