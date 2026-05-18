# cc-engine Plugin Repository

cc-engine 的官方插件市场。通过 PluginManager 自动搜索、安装、更新插件。

## 插件列表

| ID | 名称 | 版本 | 描述 |
|----|------|------|------|
| weather | Weather | 1.0.0 | 天气查询 |
| web-search | Web Search | 1.0.0 | 网络搜索 |
| translator | Translator | 1.0.0 | 多语言翻译 |
| rss-reader | RSS Reader | 1.0.0 | RSS 订阅阅读 |
| code-runner | Code Runner | 1.0.0 | 代码沙箱运行 |

## 使用方法

在 cc-engine Web 控制台 -> 学习 -> 插件列表中搜索并安装。

## 开发者

插件结构：
`
plugins/<id>/
├── plugin.json   # 插件配置
├── index.js      # 主入口
└── ...           # 其他文件
`

导出接口：
- \setup({ config, registry })\ — 初始化
- \	ools()\ — 返回工具定义数组
