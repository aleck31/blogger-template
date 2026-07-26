# Blogger Templates

自用 Blogger 主题模板集合。每个模板一个目录,包含主题 XML 和配套的 JS。

| 模板 | 说明 |
|------|------|
| [technote](technote/) | 开发者笔记风格,双栏布局,深色模式,Prism 代码高亮,Mermaid 图表 |
| [simpledays](simpledays/) | 经典 Picture Window 重构版:保留日期分组、暖米色调与原 widget 结构,Layout v3 + Bootstrap 5 响应式,深色模式 |

## 如何应用到 Blogger

以 technote 为例,其他模板同理。

### 1. 备份当前主题

Blogger 后台 → **主题** → 右上角 **⋮**(自定义旁)→ **备份**,下载当前主题 XML 留底。上传新主题会整体替换,布局里的小工具配置可能丢失。

### 2. 上传主题 XML

1. 下载模板文件:仓库里的 `technote/template.xml`(建议用已发布的 tag 版本,而不是 main 分支的开发中版本)。
2. Blogger 后台 → **主题** → **⋮** → **恢复** → 上传该 XML。
3. 上传后访问站点确认基本渲染正常。

### 3. 检查 JS 引用版本(重要)

模板通过 jsDelivr 按 git tag 加载配套 JS,XML 内的引用形如(`<x.y.z>` 为该 XML 所属版本):

```html
<script src='https://cdn.jsdelivr.net/gh/aleck31/blogger-template@v<x.y.z>/technote/main.js'/>
```

XML 和 JS 是配套发布的:**用哪个 tag 的 XML,里面就已经指向同一个 tag 的 JS**,正常情况无需改动。只有手动改过模板代码时才需要留意:jsDelivr 按 tag 永久缓存,不要把引用改成分支名(如 `@main`),否则拿到的可能是过期缓存。

### 4. 后台配置

- **布局**:各区块(Header、Featured Post、Popular Posts、Categories 等)在 **布局** 页拖拽管理;上传新主题后检查一遍小工具是否齐全。
- **主题设计器**:**主题 → 自定义** 里可调主色、背景色、字体等(模板内 `<Variable>` 定义的项)。改动会覆盖模板默认值,升级模板后需要重新核对。
- **标签约定**(technote):侧栏 Categories 列表只显示名称含 `#` 前缀的标签(如 `#AI`、`#Cloud`);不带 `#` 的标签显示为文章卡片上的代码风格 chip。给文章打标签时按此约定区分"分类"和"标签"。

### 5. 验证清单

上传后逐项过一遍:

- [ ] 首页:Featured Post、Latest Posts、侧栏渲染正常
- [ ] 文章页:标题、日期、分类 chip 与标签、目录(TOC)、代码高亮
- [ ] Mermaid 图表:三种写法均可——普通代码块内容以 `flowchart`/`graph` 等关键字开头;或 HTML 视图写 `<pre class="mermaid">`(官方推荐)/ `<div class="mermaid">`(兼容)
- [ ] 深色模式切换(导航栏月亮/太阳图标)
- [ ] 搜索、分页按钮(依赖 JS,若样式异常先查 JS 引用的 tag)
- [ ] 移动端:汉堡菜单、布局自适应

## 版本管理

- 发布单位是 **git tag**,格式 `v<major>.<minor>.<patch>`(多模板并存后改为 `<template>-v<x.y.z>` 前缀式)。
- XML 内三处版本需保持一致:`b:templateVersion` 属性、布局页角标(`body#layout:before` 的 `content`)、jsDelivr 引用的 tag。
- jsDelivr 按 tag 快照永久缓存,已发布 tag 一律不改;修 bug 就 bump patch 发新 tag。
- 升级站点 = 上传新 tag 的 XML;回滚 = 上传旧 tag 的 XML。

## 本地开发

- 模板是单文件 XML,CSS 在 `<b:skin><![CDATA[...]]]></b:skin>` 内,注意 XML 转义(`<`、`&`)。
- JS 改动推送后,开发期用 commit sha 引用绕过缓存:`@<short-sha>/technote/main.js`。
- 用一个单独的测试 blog 验证后再动正式站点。
