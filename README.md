# HTML to Markdown 浏览器插件

一个将网页内容转换为Markdown格式并保存为文件的浏览器扩展。

## 功能特性

- 将网页HTML内容转换为Markdown格式
- 支持移除沉浸式翻译等翻译插件添加的内容
- 支持保留或移除链接
- 支持通过CSS选择器指定要转换的特定区域
- 自动下载转换后的Markdown文件

## 安装方法

### Chrome/Edge 浏览器

1. 下载或克隆此项目到本地
2. 打开浏览器，访问 `chrome://extensions/` (Chrome) 或 `edge://extensions/` (Edge)
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择此项目的文件夹
6. 插件安装完成

## 使用方法

1. 打开要转换的网页
2. 点击浏览器工具栏中的插件图标
3. 在弹出的窗口中配置选项：
   - **移除翻译内容**：勾选后会移除沉浸式翻译等插件添加的翻译元素
   - **保留链接**：勾选后会保留Markdown中的链接格式
   - **CSS选择器**：可选，输入CSS选择器来指定要转换的特定区域（如 `.content`、`#main`），留空则转换整个页面
4. 点击"转换为Markdown"按钮
5. 转换完成后，Markdown文件会自动下载

## 支持的HTML元素

插件支持将以下HTML元素转换为Markdown：

- 标题：`h1`-`h6` → `#`-`######`
- 段落：`p` → 普通文本
- 强调：`strong`、`b` → `**text**`
- 斜体：`em`、`i` → `*text*`
- 代码：`code` → `` `code` ``
- 代码块：`pre` → ```code```
- 链接：`a` → `[text](url)`
- 列表：`ul`、`ol` → `- item` 或 `1. item`
- 引用：`blockquote` → `> text`
- 分隔线：`hr` → `---`
- 图片：`img` → `![alt](src)`
- 表格：`table` → Markdown表格格式

## 文件结构

```
tomarkdown/
├── manifest.json          # 插件配置文件
├── popup.html             # 弹出页面HTML
├── popup.css              # 弹出页面样式
├── popup.js               # 弹出页面逻辑
├── content.js             # 内容脚本（HTML转Markdown）
└── README.md              # 说明文档
```

## 注意事项

- 如果插件无法正常工作，请尝试刷新页面后重试
- 某些网站可能有内容安全策略（CSP）限制，可能影响插件功能
- 转换后的Markdown文件名基于网页标题，会自动清理特殊字符

## 开发

如需修改插件，编辑相应文件后：

1. 在 `chrome://extensions/` 页面找到此插件
2. 点击刷新按钮
3. 重新加载要测试的网页

## 许可证

MIT License
