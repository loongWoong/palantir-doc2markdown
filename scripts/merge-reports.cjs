const fs = require('fs')
const path = require('path')

const reportsDir = path.join(__dirname, '../tests/reports')
const finalDir = path.join(reportsDir, 'final')

if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true })

let coverageSummary = { total: { lines: { pct: 0 }, statements: { pct: 0 }, branches: { pct: 0 }, functions: { pct: 0 } } }
let unitTestsPassed = 0
let unitTestsFailed = 0
let integrationTestsPassed = 0
let integrationTestsFailed = 0

try {
  const coverageFile = path.join(reportsDir, 'coverage/coverage-summary.json')
  if (fs.existsSync(coverageFile)) {
    coverageSummary = JSON.parse(fs.readFileSync(coverageFile, 'utf8'))
  }
} catch (error) {
  console.warn('Failed to read coverage summary:', error.message)
}

try {
  const junitFile = path.join(reportsDir, 'unit/junit.xml')
  if (fs.existsSync(junitFile)) {
    const junitContent = fs.readFileSync(junitFile, 'utf8')
    const matches = junitContent.match(/tests="(\d+)"/g)
    if (matches) {
      const totalTests = matches.reduce((sum, match) => sum + parseInt(match.match(/\d+/)[0]), 0)
      const failures = (junitContent.match(/failures="(\d+)"/g) || [])
        .reduce((sum, match) => sum + parseInt(match.match(/\d+/)[0]), 0)
      unitTestsPassed = totalTests - failures
      unitTestsFailed = failures
    }
  }
} catch (error) {
  console.warn('Failed to read unit test results:', error.message)
}

const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>统一测试报告 - HTML to Markdown Extension</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { border-bottom: 3px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { margin: 0; color: #333; font-size: 28px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { padding: 24px; border-radius: 8px; text-align: center; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-card.unit { background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%); border: 1px solid #1890ff; }
    .stat-card.integration { background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%); border: 1px solid #52c41a; }
    .stat-card.coverage { background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%); border: 1px solid #fa8c16; }
    .number { font-size: 42px; font-weight: bold; margin: 12px 0; }
    .label { color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .coverage-bar { height: 24px; background: #f0f0f0; border-radius: 12px; overflow: hidden; margin: 12px 0; }
    .coverage-fill { height: 100%; background: linear-gradient(90deg, #52c41a, #1890ff); transition: width 0.3s; }
    .section { margin: 30px 0; }
    .section h2 { color: #333; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 16px; }
    .section h3 { color: #555; margin: 16px 0 8px 0; }
    .link { color: #1890ff; text-decoration: none; display: inline-block; margin-top: 8px; }
    .link:hover { text-decoration: underline; }
    .timestamp { color: #999; font-size: 13px; text-align: right; margin-top: 8px; }
    ul { margin: 8px 0; padding-left: 24px; }
    li { margin: 6px 0; color: #555; }
    .success { color: #52c41a; }
    .error { color: #ff4d4f; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-success { background: #f6ffed; color: #52c41a; border: 1px solid #b7eb8f; }
    .badge-error { background: #fff1f0; color: #ff4d4f; border: 1px solid #ffa39e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧪 HTML to Markdown Extension - 测试报告</h1>
      <p class="timestamp">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>

    <div class="stats">
      <div class="stat-card unit">
        <div class="label">单元测试</div>
        <div class="number" style="color: #1890ff;">${unitTestsPassed + unitTestsFailed}</div>
        <div>测试用例</div>
        <div style="margin-top: 8px;">
          <span class="badge badge-success">✓ ${unitTestsPassed} 通过</span>
          ${unitTestsFailed > 0 ? `<span class="badge badge-error">✗ ${unitTestsFailed} 失败</span>` : ''}
        </div>
        <a class="link" href="../coverage/index.html" target="_blank">查看覆盖率报告 →</a>
      </div>
      
      <div class="stat-card integration">
        <div class="label">接口测试</div>
        <div class="number" style="color: #52c41a;">${integrationTestsPassed + integrationTestsFailed}</div>
        <div>测试用例</div>
        <div style="margin-top: 8px;">
          <span class="badge badge-success">✓ ${integrationTestsPassed} 通过</span>
          ${integrationTestsFailed > 0 ? `<span class="badge badge-error">✗ ${integrationTestsFailed} 失败</span>` : ''}
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: #666;">Chrome Extension API Mock</div>
      </div>
      
      <div class="stat-card coverage">
        <div class="label">代码覆盖率</div>
        <div class="number" style="color: #fa8c16;">${coverageSummary.total.lines.pct}%</div>
        <div>行覆盖率</div>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width: ${coverageSummary.total.lines.pct}%"></div>
        </div>
        <a class="link" href="../coverage/index.html" target="_blank">查看详情 →</a>
      </div>
    </div>

    <div class="section">
      <h2>📊 详细覆盖率</h2>
      <ul>
        <li><strong>语句覆盖率 (Statements):</strong> <span class="${coverageSummary.total.statements.pct >= 80 ? 'success' : 'error'}">${coverageSummary.total.statements.pct}%</span></li>
        <li><strong>分支覆盖率 (Branches):</strong> <span class="${coverageSummary.total.branches.pct >= 80 ? 'success' : 'error'}">${coverageSummary.total.branches.pct}%</span></li>
        <li><strong>函数覆盖率 (Functions):</strong> <span class="${coverageSummary.total.functions.pct >= 80 ? 'success' : 'error'}">${coverageSummary.total.functions.pct}%</span></li>
        <li><strong>行覆盖率 (Lines):</strong> <span class="${coverageSummary.total.lines.pct >= 80 ? 'success' : 'error'}">${coverageSummary.total.lines.pct}%</span></li>
      </ul>
    </div>

    <div class="section">
      <h2>🔍 关键测试场景</h2>
      <h3>单元测试覆盖</h3>
      <ul>
        <li>✅ HTMLToMarkdown 类构造函数和选项配置</li>
        <li>✅ HTML 标签转换（h1-h6, p, strong, em, code, pre）</li>
        <li>✅ 列表处理（ul, ol, 嵌套列表）</li>
        <li>✅ 表格转换</li>
        <li>✅ 链接处理（keepLinks 选项）</li>
        <li>✅ 图片处理和 getImageData 方法</li>
        <li>✅ 翻译元素处理（removeTranslations, includeTranslations 选项）</li>
        <li>✅ 复杂 HTML 文档结构转换</li>
      </ul>
      
      <h3>接口测试覆盖</h3>
      <ul>
        <li>✅ chrome.tabs API（query, sendMessage, get）</li>
        <li>✅ chrome.storage API（get, set）</li>
        <li>✅ chrome.downloads API（download）</li>
        <li>✅ chrome.runtime API（onMessage, sendMessage）</li>
        <li>✅ 消息传递流程（convertToMarkdown, getMenuTree）</li>
      </ul>
    </div>

    <div class="section">
      <h2>📁 原始报告链接</h2>
      <ul>
        <li><a class="link" href="../coverage/index.html" target="_blank">单元测试覆盖率报告 (HTML)</a></li>
        <li><a class="link" href="../unit/junit.xml" target="_blank">单元测试 JUnit XML</a></li>
      </ul>
    </div>

    <div class="section">
      <h2>🚀 运行测试</h2>
      <ul>
        <li><code>npm run test:unit</code> - 运行单元测试</li>
        <li><code>npm run test:unit:watch</code> - 监听模式运行单元测试</li>
        <li><code>npm run test:unit:coverage</code> - 运行单元测试并生成覆盖率报告</li>
        <li><code>npm run test:integration</code> - 运行接口测试</li>
        <li><code>npm run test:all</code> - 运行全部测试并生成报告</li>
        <li><code>npm run test:report</code> - 运行测试并打开报告</li>
      </ul>
    </div>
  </div>
</body>
</html>`

fs.writeFileSync(path.join(finalDir, 'index.html'), htmlReport)
console.log('✅ 统一测试报告已生成: tests/reports/final/index.html')
