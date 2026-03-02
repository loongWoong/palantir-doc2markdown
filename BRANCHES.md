# 分支说明文档

## 项目分支概览

本项目包含以下分支：

- **main** - 主分支（当前分支）
- **aiTest** - AI测试分支
- **auto** - 自动化分支

---

## 分支详情

### main 分支

**状态**: 当前分支  
**描述**: 主分支，包含稳定的生产代码

**最新提交**: fix: 移除图片URL查询参数以避免SVG转PNG时文件名错误

**主要功能**:
- HTML到Markdown转换的核心功能
- 支持沉浸式翻译插件内容移除
- 支持链接保留/移除选项
- 支持CSS选择器指定转换区域
- 自动下载转换后的Markdown文件

---

### aiTest 分支

**状态**: 开发分支  
**描述**: AI测试分支，包含重构后的项目结构和完整的测试框架

**最新提交**: feat: 重构项目结构并添加完整的测试框架

**主要变更**:
- 项目结构重构
- 添加完整的测试框架
- 添加GitHub Actions工作流配置
- 更新项目文档
- 添加开发规则配置文件

**新增文件**:
- `.cursorrules` - 开发规则配置
- `.github/workflows/test.yml` - CI/CD测试工作流
- 更新的 `.gitignore` 文件
- 更新的 `README.md` 文档

**适用场景**:
- 需要运行自动化测试
- 需要CI/CD集成
- 需要遵循开发规范

---

### auto 分支（完整功能推荐使用）

**状态**: 开发分支  
**描述**: 自动化分支，包含自动化采集和图片处理功能

**最新提交**: fix: 修复嵌套列表缩进不正确的问题

**主要功能**:
- 自动采集功能
- GIF图片处理支持
- 嵌套列表缩进修复
- 列表项中的嵌套列表元素过滤
- 沉浸式翻译插件支持
- 菜单路径嵌套支持
- Markdown和图片保存路径合并

**提交历史**:
1. fix: 修复嵌套列表缩进不正确的问题
2. fix: 过滤列表项中的嵌套列表元素
3. feat: 支持沉浸式翻译插件并改进菜单路径处理
4. feat: 合并Markdown和图片保存路径并支持菜单路径嵌套
5. feat: 添加自动采集功能并支持GIF图片处理

**适用场景**:
- 需要自动采集网页内容
- 需要处理GIF图片
- 需要处理复杂的嵌套列表结构

---

## 分支切换指南

### 切换到 aiTest 分支

```bash
git checkout aiTest
```

### 切换到 auto 分支

```bash
git checkout auto
```

### 切换回 main 分支

```bash
git checkout main
```

---

## 分支合并建议

### 将 aiTest 合并到 main

```bash
git checkout main
git merge aiTest
```

### 将 auto 合并到 main

```bash
git checkout main
git merge auto
```

---

## 注意事项

1. **main分支** 应始终保持稳定状态，所有合并到main的代码都应经过充分测试
2. **aiTest分支** 包含测试框架，适合进行功能开发和测试
3. **auto分支** 包含自动化功能，适合需要自动采集和图片处理的场景
4. 在合并分支前，建议先解决可能的冲突
5. 合并后建议运行测试确保功能正常

---

## 开发工作流

1. 从main分支创建新的功能分支
2. 在功能分支上进行开发
3. 根据需要从aiTest或auto分支合并相关功能
4. 完成开发和测试后，合并回main分支

```bash
# 创建新功能分支
git checkout -b feature/new-feature

# 开发完成后合并回main
git checkout main
git merge feature/new-feature
```
