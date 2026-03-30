# GitDoc 架构设计文档

## 1. 系统概览

GitDoc 是一个基于 Git + Markdown 的团队文档管理工具。服务器本身无状态、无持久数据，所有文档、评论、用户信息均存储在用户指定的 Git 仓库中。

### 架构图

```
┌─────────────────────────────────────────────────────┐
│                   浏览器 (Browser)                    │
│  ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────────┐  │
│  │ 文档浏览  │ │ 搜索   │ │ 登录   │ │ 编辑/评论   │  │
│  └────┬─────┘ └───┬────┘ └───┬────┘ └─────┬──────┘  │
│       └───────────┴──────────┴─────────────┘         │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP (fetch / form actions)
┌──────────────────────┴───────────────────────────────┐
│                SvelteKit 服务端                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  路由层 (routes/)                               │   │
│  │  页面加载 / API 端点 / OAuth 回调               │   │
│  └──────────────────┬─────────────────────────────┘   │
│  ┌──────────────────┴─────────────────────────────┐   │
│  │  业务层 ($lib/server/)                          │   │
│  │  git 操作 / 认证 / 文档读写 / 搜索              │   │
│  └──────────────────┬─────────────────────────────┘   │
│              ┌──────┴──────┐                           │
│              │ 本地缓存     │                           │
│              │ workdir/     │                           │
│              │ caches/      │                           │
│              └──────┬──────┘                           │
└─────────────────────┬─────────────────────────────────┘
                      │ git clone / pull / push (HTTPS)
               ┌──────┴──────┐
               │ 远程 Git 仓库 │
               │ (GitHub 等)  │
               └─────────────┘
```

### 核心设计原则

- **Git 即数据库**：所有数据存储在 Git 仓库中，每次编辑/评论对应一次 commit
- **无状态服务器**：服务器不持久化任何数据，可水平扩展，支持 Node.js 和 Vercel 部署
- **本地缓存加速**：通过缓存 clone 的仓库减少网络请求，提高响应速度

---

## 2. 技术选型

| 技术               | 用途          | 选型理由                                                    |
| ------------------ | ------------- | ----------------------------------------------------------- |
| **SvelteKit**      | 全栈框架      | SSR + API routes，文件系统路由，adapter-auto 支持多平台部署 |
| **Svelte 5**       | 前端框架      | Runes 模式，细粒度响应式，编译时优化                        |
| **isomorphic-git** | Git 操作      | 纯 JS 实现，无需系统 git 二进制，兼容 Node/Vercel/Edge      |
| **jsonwebtoken**   | Session 管理  | JWT 无状态认证，适配无状态服务器架构                        |
| **mdsvex**         | Markdown 渲染 | Svelte 原生 Markdown 支持，可嵌入 Svelte 组件               |
| **Tailwind CSS 4** | 样式          | 原子化 CSS，含 forms 和 typography 插件                     |

### 为什么选 isomorphic-git 而非 simple-git

- `simple-git` 依赖系统 `git` 二进制，在 Vercel 等 serverless 环境不可用
- `isomorphic-git` 纯 JavaScript，可直接读取 git 对象，无需完整 checkout
- 提供细粒度 API，适合精确控制 commit（每次编辑/评论 = 1 次 commit）

---

## 3. 数据结构

所有数据存储在用户指定的远程 Git 仓库中，目录结构如下：

```
/
├── config.json                                      # 站点配置
├── auth/
│   └── [provider]/                                  # 如 github
│       └── [user_id]/
│           └── info.json                            # 用户信息
└── doc/
    └── [section]/                                   # 章节
        └── [doc_name]/                              # 文档
            ├── page.md                              # 文档正文
            ├── comment-{timestamp}-{userId}.md      # 评论
            └── ...
```

### 3.1 config.json

```jsonc
{
	"title": "团队文档", // 站点标题
	"description": "项目文档中心", // 站点描述
	"defaultPermissions": ["read"], // 新用户默认权限
	"apiKeys": [
		// API 访问密钥（供 LLM/Agent 使用）
		{
			"key": "sk-xxxx",
			"name": "CI Bot",
			"permissions": ["read", "comment"],
		},
	],
}
```

### 3.2 auth/[provider]/[user_id]/info.json

```jsonc
{
	"username": "zhangsan", // 显示名称
	"avatar": "https://...", // 头像 URL
	"permissions": ["read", "write", "comment", "admin"], // 权限列表
	"invitedBy": "github:12345", // 邀请人
	"createdAt": "2025-01-01T00:00:00Z",
}
```

权限说明：

- `read` — 浏览文档
- `write` — 编辑文档
- `comment` — 发表评论
- `admin` — 管理用户、修改配置

### 3.3 page.md（文档正文）

```markdown
---
title: 文档标题
author: github:12345
createdAt: 2025-01-01T00:00:00Z
updatedAt: 2025-06-15T10:30:00Z
---

文档正文内容（Markdown 格式）...
```

### 3.4 comment-{timestamp}-{userId}.md（评论）

```markdown
---
author: github:67890
createdAt: 2025-06-15T11:00:00Z
replyTo: comment-1718438400000-12345 # 可选，回复某条评论
---

评论内容...
```

文件名格式：`comment-{Unix毫秒时间戳}-{userId}.md`，确保唯一性和时间排序。

---

## 4. SvelteKit 路由设计

```
src/routes/
│
├── +layout.svelte                          # 全局布局：导航栏、认证状态
├── +layout.server.ts                       # 加载 session、仓库配置状态
├── +page.svelte                            # 首页（未配置仓库时显示引导）
├── +page.server.ts                         # 检查仓库是否已配置
│
├── auth/
│   ├── login/github/+server.ts             # GET → 重定向到 GitHub OAuth
│   ├── callback/github/+server.ts          # GET → 处理 OAuth 回调
│   └── logout/+server.ts                   # POST → 清除 session
│
├── setup/
│   ├── +page.svelte                        # 首次使用：输入 Git 仓库地址
│   └── +page.server.ts                     # POST → clone 仓库、验证结构
│
├── doc/
│   ├── +layout.svelte                      # 文档布局：侧边栏目录树
│   ├── +layout.server.ts                   # 加载章节列表
│   ├── +page.svelte                        # 文档总览
│   ├── [section]/
│   │   ├── +page.svelte                    # 章节内文档列表
│   │   ├── +page.server.ts                 # 加载该章节的文档列表
│   │   └── [doc]/
│   │       ├── +page.svelte                # 查看文档 + 评论列表
│   │       ├── +page.server.ts             # 加载 page.md + 评论
│   │       ├── edit/
│   │       │   ├── +page.svelte            # Markdown 编辑器
│   │       │   └── +page.server.ts         # 加载内容 / POST 保存编辑
│   │       └── comment/
│   │           └── +server.ts              # POST → 提交评论
│
├── search/
│   ├── +page.svelte                        # 搜索页面
│   └── +page.server.ts                     # 搜索处理（?q=关键词）
│
├── admin/
│   ├── +page.svelte                        # 管理面板：用户列表
│   ├── +page.server.ts                     # 加载用户列表
│   └── users/+server.ts                    # POST 邀请 / DELETE 移除用户
│
└── api/v1/                                 # LLM/Agent REST API
    ├── docs/
    │   ├── +server.ts                      # GET 列表 / POST 创建
    │   └── [section]/[doc]/
    │       ├── +server.ts                  # GET 读取 / PUT 更新 / DELETE 删除
    │       └── comments/+server.ts         # GET 列表 / POST 添加
    ├── search/+server.ts                   # GET 搜索
    ├── auth/+server.ts                     # GET 当前用户信息
    └── repo/
        ├── sync/+server.ts                 # POST 强制同步
        └── status/+server.ts              # GET 缓存状态
```

---

## 5. 服务端模块设计

所有服务端逻辑放在 `$lib/server/`，确保不会泄露到客户端。

```
src/lib/server/
├── git/
│   ├── operations.ts       # 核心 git 操作
│   ├── cache.ts            # 仓库缓存管理
│   └── http.ts             # HTTP 传输配置
├── auth/
│   ├── github.ts           # GitHub OAuth
│   ├── session.ts          # JWT session
│   └── permissions.ts      # 权限检查
├── docs/
│   ├── reader.ts           # 文档读取
│   ├── writer.ts           # 文档写入
│   └── search.ts           # 全文搜索
└── config.ts               # 配置管理
```

### 5.1 git/operations.ts — 核心 Git 操作

```typescript
/** clone 远程仓库到本地缓存目录 */
async function cloneRepo(url: string, dir: string, token: string): Promise<void>;

/** 拉取最新变更 */
async function pullLatest(dir: string, token: string): Promise<void>;

/** 读取仓库中的文件内容 */
async function readFile(dir: string, filepath: string): Promise<string | null>;

/** 列出目录下的文件/子目录 */
async function listDirectory(dir: string, dirpath: string): Promise<string[]>;

/** 写入文件并创建 commit，返回 commit SHA */
async function writeFileAndCommit(
	dir: string,
	filepath: string,
	content: string,
	author: { name: string; email: string },
	message: string,
): Promise<string>;

/** 推送到远程仓库 */
async function pushToRemote(dir: string, token: string): Promise<void>;
```

### 5.2 git/cache.ts — 缓存管理

```typescript
interface CacheManager {
	/**
	 * 获取仓库的本地缓存路径
	 * - 不存在则 clone
	 * - 已存在但过期则 pull
	 * - 返回缓存目录路径并加写锁
	 */
	acquire(repoUrl: string, token: string): Promise<{ dir: string; release: () => void }>;

	/** 强制清除缓存，下次 acquire 时重新 clone */
	invalidate(repoUrl: string): void;
}
```

- 缓存路径：`workdir/caches/<sha256(repoUrl)>/`
- 写锁：同一仓库同一时间只允许一个写操作（commit + push）
- 读操作不加锁，允许并发
- TTL：可配置的缓存新鲜度阈值（默认 60 秒），超时自动 pull

### 5.3 auth/github.ts — GitHub OAuth

```typescript
/** 生成 GitHub OAuth 授权 URL */
function getAuthUrl(state: string): string;

/** 用 authorization code 换取 access token */
async function exchangeCode(code: string): Promise<string>;

/** 用 access token 获取 GitHub 用户信息 */
async function getGitHubUser(token: string): Promise<{ id: number; login: string; avatar_url: string }>;
```

### 5.4 auth/session.ts — JWT Session

```typescript
interface SessionPayload {
	userId: string; // 如 "github:12345"
	provider: 'github';
	username: string;
	avatar: string;
	permissions: string[];
	ghToken: string; // GitHub access token，用于 git push
}

/** 创建 JWT 并设置 HttpOnly cookie */
function createSession(cookies: Cookies, payload: SessionPayload): void;

/** 从 cookie 中验证并解析 session */
function verifySession(cookies: Cookies): SessionPayload | null;

/** 清除 session cookie */
function destroySession(cookies: Cookies): void;
```

### 5.5 auth/permissions.ts — 权限检查

```typescript
/** 从仓库中读取用户权限信息 */
async function getUserPermissions(cacheDir: string, provider: string, userId: string): Promise<UserInfo | null>;

/** 检查用户是否具有指定权限 */
function hasPermission(user: SessionPayload, required: string): boolean;
```

### 5.6 docs/reader.ts — 文档读取

```typescript
/** 获取所有章节列表 */
async function listSections(cacheDir: string): Promise<string[]>;

/** 获取章节下的文档列表 */
async function listDocs(cacheDir: string, section: string): Promise<DocMeta[]>;

/** 读取文档内容（解析 frontmatter） */
async function readDoc(cacheDir: string, section: string, doc: string): Promise<DocContent>;

/** 读取文档的所有评论 */
async function readComments(cacheDir: string, section: string, doc: string): Promise<Comment[]>;
```

### 5.7 docs/writer.ts — 文档写入

```typescript
/** 创建或更新文档 */
async function writeDoc(
	cacheDir: string,
	section: string,
	doc: string,
	content: string,
	author: SessionPayload,
	token: string,
): Promise<string>; // commit SHA

/** 添加评论 */
async function addComment(
	cacheDir: string,
	section: string,
	doc: string,
	content: string,
	author: SessionPayload,
	token: string,
	replyTo?: string,
): Promise<string>; // commit SHA
```

### 5.8 docs/search.ts — 搜索

```typescript
interface SearchResult {
	section: string;
	doc: string;
	title: string;
	excerpt: string; // 匹配上下文
	score: number;
}

/** 全文搜索文档内容 */
async function searchDocs(cacheDir: string, query: string): Promise<SearchResult[]>;
```

---

## 6. 认证流程

```
用户点击「使用 GitHub 登录」
  │
  ▼
GET /auth/login/github
  │ 1. 生成随机 state 令牌，存入 cookie
  │ 2. 重定向到 GitHub:
  │    https://github.com/login/oauth/authorize
  │    ?client_id=...&redirect_uri=.../auth/callback/github
  │    &state=...&scope=repo
  │
  ▼
GitHub 显示授权页面 → 用户同意
  │
  ▼
GET /auth/callback/github?code=...&state=...
  │ 1. 验证 state 与 cookie 中的一致
  │ 2. POST github.com/login/oauth/access_token 换取 access_token
  │ 3. GET api.github.com/user 获取用户信息 (id, login, avatar_url)
  │ 4. 在仓库缓存中查找 /auth/github/{id}/info.json
  │    ├── 存在 → 读取权限，创建 JWT session cookie
  │    │         重定向到 /doc
  │    └── 不存在 → 返回 403（邀请制，需管理员添加）
  │
  ▼
后续请求:
  hooks.server.ts → 读取 cookie → 验证 JWT → 设置 event.locals.user
```

### hooks.server.ts 中间件

```typescript
// src/hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
	const session = verifySession(event.cookies);
	if (session) {
		event.locals.user = session;
	}
	return resolve(event);
};
```

### app.d.ts 类型定义

```typescript
declare global {
	namespace App {
		interface Locals {
			user?: {
				userId: string; // "github:12345"
				provider: 'github';
				username: string;
				avatar: string;
				permissions: string[];
				ghToken: string;
			};
		}
	}
}
```

---

## 7. 数据流：编辑文档

```
用户在编辑器中修改文档内容，点击保存
  │
  ▼
POST /doc/[section]/[doc]/edit (SvelteKit form action)
  │ body: { content: "新的 Markdown 内容..." }
  │
  ▼
+page.server.ts → actions.default:
  │ 1. 检查 event.locals.user 是否存在且有 'write' 权限
  │ 2. cacheManager.acquire(repoUrl, user.ghToken)
  │ 3. pullLatest() — 确保本地是最新
  │ 4. 更新 page.md 的 frontmatter (updatedAt) 和正文
  │ 5. writeFileAndCommit()
  │    author: { name: user.username, email: "github:id@gitdoc" }
  │    message: "编辑: [section]/[doc] by @username"
  │ 6. pushToRemote()
  │ 7. release() — 释放写锁
  │ 8. 重定向回文档查看页
```

---

## 8. 数据流：添加评论

```
用户在评论框输入内容，点击提交
  │
  ▼
POST /doc/[section]/[doc]/comment
  │ body: { content: "评论内容", replyTo?: "comment-xxx" }
  │
  ▼
+server.ts:
  │ 1. 检查 'comment' 权限
  │ 2. cacheManager.acquire()
  │ 3. pullLatest()
  │ 4. 生成文件名: comment-{Date.now()}-{userId}.md
  │ 5. 写入文件:
  │    ---
  │    author: github:67890
  │    createdAt: 2025-06-15T11:00:00Z
  │    replyTo: comment-xxx  (如有)
  │    ---
  │    评论内容...
  │ 6. commit: "评论: [section]/[doc] by @username"
  │ 7. push → release
  │ 8. 返回 201 + 评论数据
```

---

## 9. API 设计（供 LLM/Agent 使用）

所有 API 端点位于 `/api/v1/`，使用 Bearer token 认证。

### 认证方式

```
Authorization: Bearer <token>
```

token 可以是：

- 用户的 GitHub access token
- `config.json` 中配置的 API key

### 端点列表

| 方法   | 路径                                    | 说明               |
| ------ | --------------------------------------- | ------------------ |
| GET    | `/api/v1/docs`                          | 列出所有章节和文档 |
| POST   | `/api/v1/docs`                          | 创建新文档         |
| GET    | `/api/v1/docs/[section]/[doc]`          | 读取文档内容       |
| PUT    | `/api/v1/docs/[section]/[doc]`          | 更新文档           |
| DELETE | `/api/v1/docs/[section]/[doc]`          | 删除文档           |
| GET    | `/api/v1/docs/[section]/[doc]/comments` | 列出评论           |
| POST   | `/api/v1/docs/[section]/[doc]/comments` | 添加评论           |
| GET    | `/api/v1/search?q=keyword`              | 搜索文档           |
| GET    | `/api/v1/auth`                          | 当前用户信息       |
| POST   | `/api/v1/repo/sync`                     | 强制从远程同步     |
| GET    | `/api/v1/repo/status`                   | 缓存状态           |

### 请求/响应示例

#### GET /api/v1/docs

```json
// Response 200
{
	"sections": [
		{
			"name": "getting-started",
			"docs": [
				{ "name": "introduction", "title": "简介", "updatedAt": "2025-06-15T10:30:00Z" },
				{ "name": "installation", "title": "安装指南", "updatedAt": "2025-06-14T08:00:00Z" }
			]
		}
	]
}
```

#### PUT /api/v1/docs/[section]/[doc]

```json
// Request
{ "content": "# 新内容\n\n更新后的文档..." }

// Response 200
{ "commitSha": "abc123...", "updatedAt": "2025-06-15T12:00:00Z" }
```

#### POST /api/v1/docs/[section]/[doc]/comments

```json
// Request
{ "content": "这里有个 typo", "replyTo": "comment-1718438400000-12345" }

// Response 201
{
  "id": "comment-1718442000000-67890",
  "author": "zhangsan",
  "createdAt": "2025-06-15T12:00:00Z",
  "commitSha": "def456..."
}
```

---

## 10. 搜索实现方案

### Node.js 持久模式

当服务器以 Node.js 长驻进程运行时：

1. 首次 pull 后，遍历 `/doc/` 下所有 `.md` 文件
2. 解析 Markdown，提取纯文本
3. 构建内存中的倒排索引（词 → 文档列表）
4. 后续 pull 时增量更新索引
5. 搜索时在索引中查找，返回匹配结果和上下文摘要

### Vercel 无状态模式

每次请求都是冷启动，无法维持内存索引：

1. acquire 缓存仓库
2. 遍历 `/doc/` 下所有 `.md` 文件
3. 逐文件进行字符串匹配
4. 返回匹配结果

对于中小规模团队文档（< 1000 个文件），暴力扫描的延迟可接受（< 1s）。

---

## 11. 前端组件规划

```
src/lib/components/
├── layout/
│   ├── Navbar.svelte              # 顶部导航：Logo、搜索入口、用户头像/登录
│   └── Sidebar.svelte             # 侧边栏：文档目录树，可折叠章节
├── doc/
│   ├── DocViewer.svelte           # Markdown 渲染（使用 mdsvex）
│   ├── DocEditor.svelte           # Markdown 编辑器（textarea + 实时预览）
│   ├── DocMeta.svelte             # 文档元信息：作者、更新时间
│   └── DocList.svelte             # 文档列表卡片
├── comment/
│   ├── CommentList.svelte         # 评论列表（按时间排序，支持嵌套回复）
│   └── CommentForm.svelte         # 评论输入框
├── search/
│   └── SearchBar.svelte           # 搜索输入 + 结果下拉
└── auth/
    └── LoginButton.svelte         # GitHub 登录按钮
```

---

## 12. 缓存策略

### 缓存目录结构

```
workdir/caches/
└── <sha256(repoUrl)>/             # 每个仓库一个目录
    ├── .git/                      # git 数据
    ├── doc/                       # 工作树
    ├── auth/
    └── config.json
```

### 缓存生命周期

1. **首次访问**：clone 远程仓库到缓存目录
2. **读操作**：检查缓存时间戳，超过 TTL（默认 60s）则 pull
3. **写操作**：先 pull，再 commit + push，确保不冲突
4. **强制同步**：`POST /api/v1/repo/sync` 触发立即 pull

### 并发控制

- 读操作：无锁，允许并发
- 写操作：互斥锁（per-repo），同一时间只允许一个写操作
- 锁实现：内存中的 Promise 队列（Node 模式）或请求级别串行化（Vercel 模式）

### Vercel 部署注意事项

- `/tmp/` 目录是临时的，函数冷启动时缓存不存在
- 每次冷启动需要重新 clone（可通过 shallow clone 加速）
- 热启动期间缓存有效，可复用
