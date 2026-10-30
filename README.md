# Postman Web

浏览器里的 HTTP API 调试工具 —— 不用装客户端，打开网页就能构造请求、查看响应、管理请求集合与环境变量。

> React 18 + TypeScript + Vite + MUI + Tailwind CSS + Zustand ｜ 纯静态部署 ｜ 数据全部存在本机浏览器

## 功能

- **请求构建**：GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS，Params、Headers、Body（none / form-data 含文件 / x-www-form-urlencoded / JSON / Text / XML）、Auth（Bearer / Basic / API Key）
- **响应查看**：状态码、耗时、大小、响应头、Set-Cookie；Body 支持 Pretty（自研 JSON 高亮）/ Raw / Preview 三视图
- **集合管理**：新建集合、保存/更新/复制/删除请求，点击即在新标签打开
- **环境变量**：多环境切换，请求中写 `{{baseUrl}}` 自动替换，缺失变量会红字提示
- **历史记录**：自动记录，一键重发，最多 200 条
- **多标签页**：每个标签独立请求与响应，状态可持久化
- **设置**：浅色/深色/跟随系统、字号、超时、响应体上限、数据导出导入清空
- **cURL 生成**：一键复制等价命令

## 本地开发

```bash
npm install
npm run dev          # http://localhost:5173
```

构建静态产物：

```bash
npm run build        # 输出 dist/
npm run preview      # 本地预览 dist
```

## 解决 CORS

浏览器不允许网页直接请求未授权的跨域接口。两种办法：

1. **让目标接口允许跨域**（推荐，生产环境正规做法）。
2. **使用仓库自带的本地代理**：

```bash
npm run proxy        # 默认 http://127.0.0.1:8787，端点 /proxy
```

代理是**零依赖**实现（只用 Node 内置模块），克隆后无需额外安装即可运行。

然后在前端「设置 → 代理」里：

1. 打开「使用本地代理」开关；
2. 代理地址填 `http://127.0.0.1:8787/proxy`。

代理为字节级透传：把请求原样转发到 `X-Target-URL` 指向的地址，自己处理 OPTIONS 预检与 3xx 重定向，并摘掉 `Origin`/`Referer` 以免触发目标站 WAF；支持 form-data 上传与二进制响应。

排障：浏览器访问 `http://127.0.0.1:8787/health` 应返回 `{"ok":true,...}`。若打不开，说明代理没起来（看终端里的 `EADDRINUSE` 之类报错）；若健康检查正常但仍报网络错误，把目标地址临时贴到浏览器地址栏验证它本身是否可达。

## 部署到 GitHub Pages

仓库已带 `.github/workflows/deploy.yml`：推送到 `main` 分支即自动构建并发布。

首次使用需在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**（工作流里的 `actions/configure-pages` 也会尝试自动开启）。

## 快捷键

| 快捷键 | 作用 |
|--------|------|
| `Cmd/Ctrl + Enter` | 发送当前请求 |
| `Cmd/Ctrl + T` | 新建标签页 |
| `Cmd/Ctrl + W` | 关闭当前标签页 |

## 数据存储

所有数据保存在浏览器 `localStorage`，前缀 `pmweb:`：

| key | 内容 |
|-----|------|
| `pmweb:tabs` | 标签页（响应体不落盘） |
| `pmweb:collections` | 请求集合 |
| `pmweb:history` | 历史记录 |
| `pmweb:environments` | 环境与变量 |
| `pmweb:settings` | 设置 |

换浏览器/换设备请用「设置 → 导出备份」迁移。

## 目录结构

```
src/
├── components/
│   ├── builder/      请求构建（UrlBar、Params/Headers/Body/Auth）
│   ├── collection/   集合树、保存对话框
│   ├── common/       键值编辑器、Toast
│   ├── environment/  环境与变量管理
│   ├── history/      历史记录
│   ├── layout/       顶栏、标签栏、侧边栏、设置
│   └── response/     响应面板、JSON 高亮
├── hooks/            useSendRequest（发送流程）
├── services/         requestService（fetch + 代理）
├── store/            Zustand stores
├── theme/            MUI 主题
├── types/            领域模型
└── utils/            变量插值、JSON 词法、cURL、格式化
server/proxy.js       本地 CORS 代理（零依赖，仅用 Node 内置模块）
docs/PRD.md           产品需求文档
```

## License

MIT
