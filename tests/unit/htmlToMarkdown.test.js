import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HTMLToMarkdown } from '../../src/htmlToMarkdown.js'

describe('HTMLToMarkdown', () => {
  let converter

  beforeEach(() => {
    converter = new HTMLToMarkdown()
  })

  describe('constructor', () => {
    it('should initialize with default options', () => {
      expect(converter.removeTranslations).toBe(false)
      expect(converter.keepLinks).toBe(true)
      expect(converter.includeTranslations).toBe(false)
      expect(converter.images).toEqual([])
    })

    it('should accept custom options', () => {
      const customConverter = new HTMLToMarkdown({
        removeTranslations: true,
        keepLinks: false,
        includeTranslations: true
      })
      expect(customConverter.removeTranslations).toBe(true)
      expect(customConverter.keepLinks).toBe(false)
      expect(customConverter.includeTranslations).toBe(true)
    })
  })

  describe('convert', () => {
    it('should return empty string for null element', () => {
      const result = converter.convert(null)
      expect(result).toBe('')
    })

    it('should return empty string for undefined element', () => {
      const result = converter.convert(undefined)
      expect(result).toBe('')
    })

    it('should convert simple paragraph', () => {
      const div = document.createElement('div')
      div.innerHTML = '<p>Hello World</p>'
      const result = converter.convert(div)
      expect(result).toBe('Hello World\n\n')
    })

    it('should convert heading tags', () => {
      const div = document.createElement('div')
      div.innerHTML = '<h1>Title 1</h1><h2>Title 2</h2><h3>Title 3</h3>'
      const result = converter.convert(div)
      expect(result).toContain('# Title 1\n\n')
      expect(result).toContain('## Title 2\n\n')
      expect(result).toContain('### Title 3\n\n')
    })

    it('should convert bold and italic text', () => {
      const div = document.createElement('div')
      div.innerHTML = '<p><strong>Bold</strong> and <em>Italic</em> text</p>'
      const result = converter.convert(div)
      expect(result).toContain('**Bold**')
      expect(result).toContain('*Italic*')
    })

    it('should convert inline code', () => {
      const div = document.createElement('div')
      div.innerHTML = '<p>Use <code>console.log()</code> for debugging</p>'
      const result = converter.convert(div)
      expect(result).toContain('`console.log()`')
    })

    it('should convert code blocks', () => {
      const div = document.createElement('div')
      div.innerHTML = '<pre>const x = 1;</pre>'
      const result = converter.convert(div)
      expect(result).toContain('```\nconst x = 1;\n```\n\n')
    })

    it('should convert links when keepLinks is true', () => {
      const div = document.createElement('div')
      div.innerHTML = '<a href="https://example.com">Example</a>'
      const result = converter.convert(div)
      expect(result).toBe('[Example](https://example.com)')
    })

    it('should not convert links when keepLinks is false', () => {
      const converterNoLinks = new HTMLToMarkdown({ keepLinks: false })
      const div = document.createElement('div')
      div.innerHTML = '<a href="https://example.com">Example</a>'
      const result = converterNoLinks.convert(div)
      expect(result).toBe('Example')
    })

    it('should convert unordered lists', () => {
      const div = document.createElement('div')
      div.innerHTML = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const result = converter.convert(div)
      expect(result).toContain('- Item 1\n')
      expect(result).toContain('- Item 2\n')
    })

    it('should convert ordered lists', () => {
      const div = document.createElement('div')
      div.innerHTML = '<ol><li>First</li><li>Second</li></ol>'
      const result = converter.convert(div)
      expect(result).toContain('1. First\n')
      expect(result).toContain('2. Second\n')
    })

    it('should convert nested lists', () => {
      const div = document.createElement('div')
      div.innerHTML = '<ul><li>Parent<ul><li>Child</li></ul></li></ul>'
      const result = converter.convert(div)
      expect(result).toContain('- Parent')
      expect(result).toContain('  - Child')
    })

    it('should convert blockquotes', () => {
      const div = document.createElement('div')
      div.innerHTML = '<blockquote>This is a quote</blockquote>'
      const result = converter.convert(div)
      expect(result).toContain('> This is a quote\n\n')
    })

    it('should convert horizontal rules', () => {
      const div = document.createElement('div')
      div.innerHTML = '<hr>'
      const result = converter.convert(div)
      expect(result).toBe('---\n\n')
    })

    it('should convert images', () => {
      const div = document.createElement('div')
      div.innerHTML = '<img src="image.png" alt="Test Image">'
      const result = converter.convert(div)
      expect(result).toContain('![Test Image](image.png)')
    })

    it('should convert tables', () => {
      const div = document.createElement('div')
      div.innerHTML = `
        <table>
          <tr><th>Name</th><th>Age</th></tr>
          <tr><td>John</td><td>30</td></tr>
        </table>
      `
      const result = converter.convert(div)
      expect(result).toContain('| Name | Age |')
      expect(result).toContain('| --- | --- |')
      expect(result).toContain('| John | 30 |')
    })

    it('should remove translation elements when removeTranslations is true', () => {
      const converterRemove = new HTMLToMarkdown({ removeTranslations: true })
      const div = document.createElement('div')
      div.innerHTML = `
        <p>Original text</p>
        <div class="immersive-translate-target-wrapper">
          <div class="immersive-translate-target-inner">Translated text</div>
        </div>
      `
      const result = converterRemove.convert(div)
      expect(result).toContain('Original text')
      expect(result).not.toContain('Translated text')
    })
  })

  describe('removeTranslationElements', () => {
    it('should remove immersive-translate elements', () => {
      const div = document.createElement('div')
      div.innerHTML = `
        <div class="immersive-translate-target-wrapper">Content</div>
        <div class="immersive-translate-target-inner">Translation</div>
      `
      converter.removeTranslationElements(div)
      expect(div.querySelector('.immersive-translate-target-wrapper')).toBeNull()
      expect(div.querySelector('.immersive-translate-target-inner')).toBeNull()
    })
  })

  describe('isTranslationWrapper', () => {
    it('should identify translation wrapper elements', () => {
      const wrapper = document.createElement('div')
      wrapper.classList.add('immersive-translate-target-wrapper')
      expect(converter.isTranslationWrapper(wrapper)).toBe(true)
    })

    it('should return false for non-wrapper elements', () => {
      const div = document.createElement('div')
      expect(converter.isTranslationWrapper(div)).toBe(false)
    })
  })

  describe('processTranslationNode', () => {
    it('should combine original and translation text', () => {
      const wrapper = document.createElement('div')
      wrapper.classList.add('immersive-translate-target-wrapper')
      wrapper.innerHTML = 'Original <div class="immersive-translate-target-inner">Translation</div>'
      
      const result = converter.processTranslationNode(wrapper)
      expect(result).toContain('Original')
      expect(result).toContain('Translation')
    })
  })

  describe('extractTranslationText', () => {
    it('should extract text from translation inner wrapper', () => {
      const node = document.createElement('div')
      node.innerHTML = '<div class="immersive-translate-target-inner">Translated text</div>'
      
      const result = converter.extractTranslationText(node)
      expect(result).toBe('Translated text')
    })

    it('should return empty string when no inner wrapper found', () => {
      const node = document.createElement('div')
      const result = converter.extractTranslationText(node)
      expect(result).toBe('')
    })
  })

  describe('extractOriginalText', () => {
    it('should extract original text without translation elements', () => {
      const node = document.createElement('div')
      node.innerHTML = 'Original <div class="immersive-translate-target-inner">Translation</div>'
      
      const result = converter.extractOriginalText(node)
      expect(result).toContain('Original')
      expect(result).not.toContain('Translation')
    })
  })

  describe('a complex HTML document', () => {
    it('should convert a complete document structure', () => {
      const html = `
        <article>
          <h1>Article Title</h1>
          <p>This is an introduction paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
          
          <h2>Features</h2>
          <ul>
            <li>Feature 1</li>
            <li>Feature 2</li>
          </ul>
          
          <h2>Code Example</h2>
          <pre>function hello() {
  console.log('Hello world');
}</pre>
          
          <h2>Table</h2>
          <table>
            <tr><th>Column 1</th><th>Column 2</th></tr>
            <tr><td>Data 1</td><td>Data 2</td></tr>
          </table>
        </article>
      `
      
      const div = document.createElement('div')
      div.innerHTML = html
      const result = converter.convert(div)
      
      expect(result).toContain('# Article Title\n\n')
      expect(result).toContain('**bold**')
      expect(result).toContain('*italic*')
      expect(result).toContain('- Feature 1')
      expect(result).toContain('```')
      expect(result).toContain('| Column 1 | Column 2 |')
    })
  })
})
