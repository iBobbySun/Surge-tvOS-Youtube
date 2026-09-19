# Surge tvOS YouTube Enhance

针对 **Surge TV / Apple TV (tvOS)** 适配的 YouTube Enhance 模块。

上游项目：`gholts/surge` 的 `youtube-enhance.sgmodule`。本仓库主要解决 tvOS 的 Surge 脚本环境只有 JavaScriptCore（JSC），而上游 `response.js` 使用 `TextEncoder` / `TextDecoder` 的兼容问题。

## 文件

- `youtube-enhance-tvos.sgmodule`：Surge TV 模块入口
- `youtube-response-tvos-loader.js`：为 tvOS/JSC 补充 UTF-8 `TextEncoder` / `TextDecoder`，再加载上游最新版 `response.js`

## Surge TV 模块地址

```text
https://raw.githubusercontent.com/iBobbySun/Surge-tvOS-Youtube/main/youtube-enhance-tvos.sgmodule
```

## 工作方式

- `request.js`：直接使用上游最新版
- `response.js`：通过本仓库 loader 加载上游最新版
- loader 仅在系统缺少 `TextEncoder` / `TextDecoder` 时注入兼容实现
- 模块限制为 `SYSTEM = 'tvOS'`，并明确使用 `engine=jsc`

## 默认参数

- `block_upload=true`
- `block_shorts=false`
- `auto_hd=true`
- `block_games=true`
- `block_vertical_live=false`

## 注意

YouTube 的 Apple TV 客户端接口可能随服务端更新变化。本仓库尽量复用上游逻辑以减少维护成本，但无法保证任何未来版本始终有效。

使用前请确保 Surge TV 的 MITM 已正确部署并信任相关证书。
