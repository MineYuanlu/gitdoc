# GitDoc

基于 Git + Markdown 的团队文档管理工具。

## 功能特性

- **Git 驱动** — 所有文档、评论、用户数据存储在 Git 仓库中，天然版本控制
- **Markdown 编辑** — 支持 Markdown 编写和实时预览
- **评论系统** — 每条评论对应一次 Git commit，完整追溯
- **GitHub OAuth 登录** — 邀请制，通过仓库内用户文件控制权限
- **全文搜索** — 搜索文档标题和内容
- **API 接口** — RESTful API 供 LLM/Agent 集成
- **无状态部署** — 支持 Node.js 和 Vercel，服务器不持久化数据

## 技术栈

- **前端**: SvelteKit + Svelte 5 (Runes) + Tailwind CSS 4
- **Markdown**: mdsvex
- **Git 操作**: isomorphic-git
- **认证**: GitHub OAuth + JWT
- **测试**: Vitest + Playwright

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

首次启动后，在浏览器中打开应用，按引导配置你的 Git 文档仓库地址。

## 数据结构

GitDoc 本身只包含管理器代码。文档数据存储在你指定的 Git 仓库中：

```
your-doc-repo/
├── config.json                              # 站点配置
├── auth/github/[userId]/info.json           # 用户信息和权限
└── doc/[章节]/[文档名]/
    ├── page.md                              # 文档正文
    └── comment-{timestamp}-{userId}.md      # 评论
```

## API

GitDoc 提供 RESTful API 供 LLM/Agent 使用，所有端点位于 `/api/v1/`。

| 端点                                             | 说明          |
| ------------------------------------------------ | ------------- |
| `GET /api/v1/docs`                               | 列出所有文档  |
| `GET/PUT /api/v1/docs/[section]/[doc]`           | 读取/更新文档 |
| `GET/POST /api/v1/docs/[section]/[doc]/comments` | 评论          |
| `GET /api/v1/search?q=keyword`                   | 搜索          |

详细 API 文档见 [架构设计](doc/architecture.md#9-api-设计供-llmagent-使用)。

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run check        # TypeScript 类型检查
npm run lint         # 代码检查 (ESLint + Prettier)
npm run format       # 代码格式化
npm run test:unit    # 运行单元测试
npm run test:e2e     # 运行端到端测试
npm run test         # 运行所有测试
```

## 环境变量

```bash
GITHUB_CLIENT_ID=        # GitHub OAuth App Client ID
GITHUB_CLIENT_SECRET=    # GitHub OAuth App Client Secret
JWT_SECRET=              # JWT 签名密钥
REPO_URL=                # 默认文档仓库地址（可选，也可在 UI 中配置）
```

## 许可证

MIT
