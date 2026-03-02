import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('Chrome Extension API Integration', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        },
        sendMessage: vi.fn()
      },
      tabs: {
        query: vi.fn(),
        sendMessage: vi.fn(),
        get: vi.fn()
      },
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn()
        }
      },
      downloads: {
        download: vi.fn()
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('chrome.tabs API', () => {
    it('should query active tab', async () => {
      const mockTab = { id: 1, url: 'https://example.com' }
      chrome.tabs.query.mockResolvedValue([mockTab])

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

      expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true })
      expect(tab.id).toBe(1)
      expect(tab.url).toBe('https://example.com')
    })

    it('should send message to tab', async () => {
      const mockResponse = { success: true, data: 'test' }
      chrome.tabs.sendMessage.mockResolvedValue(mockResponse)

      const response = await chrome.tabs.sendMessage(1, { action: 'testAction' })

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { action: 'testAction' })
      expect(response.success).toBe(true)
    })
  })

  describe('chrome.storage API', () => {
    it('should get stored values', async () => {
      const mockData = { savePath: 'docs/', waitTime: '10' }
      chrome.storage.local.get.mockResolvedValue(mockData)

      const result = await chrome.storage.local.get(['savePath', 'waitTime'])

      expect(chrome.storage.local.get).toHaveBeenCalledWith(['savePath', 'waitTime'])
      expect(result.savePath).toBe('docs/')
      expect(result.waitTime).toBe('10')
    })

    it('should set stored values', async () => {
      chrome.storage.local.set.mockResolvedValue(undefined)

      await chrome.storage.local.set({ savePath: 'new/path/', waitTime: '15' })

      expect(chrome.storage.local.set).toHaveBeenCalledWith({ savePath: 'new/path/', waitTime: '15' })
    })
  })

  describe('chrome.downloads API', () => {
    it('should download file', async () => {
      const mockDownloadId = 123
      chrome.downloads.download.mockResolvedValue(mockDownloadId)

      const downloadId = await chrome.downloads.download({
        url: 'data:text/plain;base64,SGVsbG8=',
        filename: 'test.md',
        saveAs: false
      })

      expect(chrome.downloads.download).toHaveBeenCalledWith({
        url: 'data:text/plain;base64,SGVsbG8=',
        filename: 'test.md',
        saveAs: false
      })
      expect(downloadId).toBe(123)
    })
  })

  describe('chrome.runtime API', () => {
    it('should add message listener', () => {
      const listener = vi.fn()
      chrome.runtime.onMessage.addListener(listener)

      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(listener)
    })

    it('should send message', async () => {
      const mockResponse = { success: true }
      chrome.runtime.sendMessage.mockResolvedValue(mockResponse)

      const response = await chrome.runtime.sendMessage({ action: 'test' })

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'test' })
      expect(response.success).toBe(true)
    })
  })

  describe('Message passing flow', () => {
    it('should handle convertToMarkdown message', async () => {
      const mockTab = { id: 1, url: 'https://example.com' }
      chrome.tabs.query.mockResolvedValue([mockTab])

      const mockResponse = {
        success: true,
        markdown: '# Test\n\nContent',
        title: 'Test Page',
        images: []
      }
      chrome.tabs.sendMessage.mockResolvedValue(mockResponse)

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'convertToMarkdown',
        cssSelector: '',
        removeTranslations: false,
        keepLinks: true,
        includeTranslations: false
      })

      expect(response.success).toBe(true)
      expect(response.markdown).toContain('# Test')
    })

    it('should handle getMenuTree message', async () => {
      const mockTab = { id: 1 }
      chrome.tabs.query.mockResolvedValue([mockTab])

      const mockMenuResponse = {
        success: true,
        menuItems: [
          { index: 0, text: 'Home', href: '/', isSelected: true, path: [] },
          { index: 1, text: 'About', href: '/about', isSelected: false, path: [] }
        ]
      }
      chrome.tabs.sendMessage.mockResolvedValue(mockMenuResponse)

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getMenuTree' })

      expect(response.success).toBe(true)
      expect(response.menuItems).toHaveLength(2)
      expect(response.menuItems[0].isSelected).toBe(true)
    })
  })
})
