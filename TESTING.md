# 测试框架使用指南

本项目已配置完整的测试框架，包括单元测试、接口测试和测试报告生成。

## 📁 项目结构

```
tom/
├── src/                    # 源代码
├── tests/                  # 测试目录
│   ├── unit/               # 单元测试
│   │   ├── htmlToMarkdown.test.js
│   │   └── htmlToMarkdown.js
│   ├── integration/        # 接口测试
│   │   └── chrome-api.test.js
│   ├── e2e/               # E2E 测试（预留）
│   └── reports/            # 测试报告输出
│       ├── coverage/        # 覆盖率报告
│       ├── unit/           # 单元测试报告
│       └── final/          # 合并后的最终报告
├── scripts/                # 工具脚本
│   └── merge-reports.js    # 报告合并脚本
├── vitest.config.ts        # Vitest 配置
├── package.json            # 项目配置
└── .cursorrules            # Cursor AI 规则
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 运行测试

```bash
# 运行单元测试
npm run test:unit

# 监听模式运行单元测试（开发时使用）
npm run test:unit:watch

# 运行单元测试并生成覆盖率报告
npm run test:unit:coverage

# 运行接口测试
npm run test:integration

# 运行所有测试
npm run test:all

# 运行所有测试并生成合并报告
npm run test:report
```

## 📊 查看测试报告

### 覆盖率报告

运行 `npm run test:unit:coverage` 后，打开以下文件查看覆盖率报告：

```
tests/reports/coverage/index.html
```

### 统一测试报告

运行 `npm run test:report` 后，打开以下文件查看统一测试报告：

```
tests/reports/final/index.html
```

## 🧪 编写测试

### 单元测试示例

在 `tests/unit/` 目录下创建测试文件：

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { HTMLToMarkdown } from './htmlToMarkdown.js'

describe('HTMLToMarkdown', () => {
  let converter

  beforeEach(() => {
    converter = new HTMLToMarkdown()
  })

  it('should convert paragraph to markdown', () => {
    const div = document.createElement('div')
    div.innerHTML = '<p>Hello World</p>'
    const result = converter.convert(div)
    expect(result).toBe('Hello World\n\n')
  })
})
```

### 接口测试示例

在 `tests/integration/` 目录下创建测试文件：

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Chrome Extension API', () => {
  beforeEach(() => {
    global.chrome = {
      tabs: {
        query: vi.fn(),
        sendMessage: vi.fn()
      }
    }
  })

  it('should query active tab', async () => {
    const mockTab = { id: 1, url: 'https://example.com' }
    chrome.tabs.query.mockResolvedValue([mockTab])

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    expect(tab.id).toBe(1)
  })
})
```

## 🔧 配置说明

### Vitest 配置 (vitest.config.ts)

- **环境**: happy-dom（浏览器环境模拟）
- **测试文件匹配**: `tests/unit/**/*.{test,spec}.{js,ts}`
- **覆盖率报告**: text, json, html
- **JUnit 报告**: tests/reports/unit/junit.xml

### Cursor AI 规则 (.cursorrules)

Cursor AI 会遵循 `.cursorrules` 文件中定义的测试规范，包括：
- 测试文件命名规范
- 测试覆盖要求
- Chrome Extension API Mock 规范

## 🔄 CI/CD 集成

项目已配置 GitHub Actions，会在以下情况自动运行测试：

- Push 到 `main` 或 `develop` 分支
- 创建 Pull Request

### CI/CD 功能

1. **自动运行测试**: 单元测试 + 接口测试
2. **生成测试报告**: 覆盖率报告 + 统一报告
3. **上传报告**: 将测试报告作为 artifact 上传
4. **PR 评论**: 自动在 PR 中评论测试结果
5. **覆盖率检查**: 确保代码覆盖率不低于 60%

## 📝 测试覆盖范围

### HTMLToMarkdown 类

- ✅ 构类函数和选项配置
- ✅ HTML 标签转换（h1-h6, p, strong, em, code, pre）
- ✅ 列表处理（ul, ol, 嵌套列表）
- ✅ 表格转换
- ✅ 链接处理（keepLinks 选项）
- ✅ 图片处理和 getImageData 方法
- ✅ 翻译元素处理（removeTranslations, includeTranslations 选项）
- ✅ 复杂 HTML 文档结构转换

### Chrome Extension API

- ✅ chrome.tabs API（query, sendMessage, get）
- ✅ chrome.storage API（get, set）
- ✅ chrome.downloads API（download）
- ✅ chrome.runtime API（onMessage, sendMessage）
- ✅ 消息传递流程（convertToMarkdown, getMenuTree）

## 🛠️ 故障排除

### 测试运行失败

1. 确保已安装所有依赖：`npm install`
2. 检查 Node.js 版本（推荐 18+）：`node --version`
3. 查看详细错误信息：`npm run test:unit -- --reporter=verbose`

### 覆盖率报告未生成

1. 确保运行了 `npm run test:unit:coverage`
2. 检查 `tests/reports/coverage/` 目录是否存在
3. 查看控制台是否有错误信息

### Chrome API Mock 问题

1. 确保在 `beforeEach` 中设置了 `global.chrome`
2. 使用 `vi.fn()` 创建 mock 函数
3. 使用 `mockResolvedValue` 或 `mockReturnValue` 设置返回值

## 📚 参考资源

- [Vitest 官方文档](https://vitest.dev/)
- [happy-dom 文档](https://github.com/capricorn86/happy-dom)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/testing/)
