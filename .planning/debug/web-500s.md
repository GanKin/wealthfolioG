---
status: investigating
trigger: "Investigate issue: web mode multiple endpoints returning 500"
created: 2026-05-16T00:00:00+08:00
updated: 2026-05-16T00:00:00+08:00
---

## Current Focus
hypothesis: web 启动时某个共享后端依赖初始化失败，导致多个 API 和 invoke 命令统一返回 500
test: 先定位 /api/v1/auth/status、/api/v1/settings、/api/v1/portfolio/update、/api/v1/events/stream 以及 list_installed_addons 的实现和它们共同依赖的服务初始化
expecting: 能找到一个上游错误点，解释为什么多个无关接口同时 500
next_action: 搜索这些端点和命令的定义，检查共同调用链

## Symptoms
expected: Web mode should load auth status, settings, addons, and trigger portfolio updates without server errors.
actual: Multiple endpoints return 500 Internal Server Error; frontend logs show failures fetching auth status, settings, addons, and portfolio update/stream.
errors: "Failed to load resource: the server responded with a status of 500 (Internal Server Error)", "[Invoke] Command \"list_installed_addons\" failed: Internal Server Error", "Failed to discover addons", "Failed to save onboarding settings: Error: Internal Server Error"
reproduction: Start the web app and load it; the frontend immediately requests auth status, settings, addons, and portfolio updates, each failing with 500.
started: Appears during current web startup; no evidence it ever worked in this session.

## Eliminated
- `auth/status` handler itself: 在干净启动的 server 上返回 `200 OK`，响应体为 `{"requiresPassword":false}`。
- `settings` 基础读接口：在干净启动的 server 上返回 `200 OK`，并能读取默认 settings。
- `addons/installed`：在干净启动的 server 上返回 `200 OK`，空 addons 目录会返回 `[]`，不会 500。
- `portfolio/update`：在干净启动的 server 上返回 `202 Accepted`。
- 后端全局路由/中间件问题：`/api/v1/healthz` 也能 `200 OK`。

## Evidence
- 本地用临时环境变量启动 `apps/server` 后，以下接口均正常：
  - `GET /api/v1/auth/status` → `200 OK`
  - `GET /api/v1/settings` → `200 OK`
  - `GET /api/v1/healthz` → `200 OK`
  - `GET /api/v1/addons/installed` → `200 OK`
  - `POST /api/v1/portfolio/update` → `202 Accepted`
- 启动日志只有常规警告，没有 panic 或请求级错误。
- 这说明仓库当前代码在“干净数据库 + 本地默认配置”下是工作的。

## Resolution
root_cause: 当前未能在仓库代码中复现 500；更可能是用户本地运行环境、旧数据库/数据目录、或启动配置与本地干净环境不一致。
fix: 暂无代码修改。
verification: 已用本地启动 server 并 curl 验证上述接口返回正常状态码。
files_changed: []
