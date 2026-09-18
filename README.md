# 朱墨案头 · 待办工作台（Next.js 全栈版）

体制内个人待办工作台。由上一级的 `index.html`（OpenDesign 跟踪的单文件原版）1:1 迁移而来，
前端（React 19）与后端（Next.js 15 Route Handlers + Neon Postgres）合并为**这一个项目**：
页面和 `/api` 同源，一个进程跑通全栈，一个项目部署 Vercel。

## 运行

```bash
cd zhumo-next
npm install        # 首次
npm run dev        # → http://localhost:3001（页面 + API 同源）
```

> 端口 3001：本机 3000/5173/5174 常被其他项目（gongzhang 等）占用，已在 package.json 固定。

数据策略：**云端（Neon，按用户隔离）是唯一事实源**。打开页面先渲染本机缓存（键
`zhumo.desk.v1:<用户名>`，按账号隔离），再拉 `/api/tasks`，拉到后一律以云端为准；
每次改动整表 PUT 上云；后端不可达时停留在本机缓存（toast 提示），恢复后自动续传。
空账号就是空案头 —— 示例数据用 ⚙ 菜单手动恢复；不会把浏览器缓存推给云端为空的新账号
（旧版该行为在多用户下属于跨用户泄漏，已移除）。

## 目录结构

```
zhumo-next/
├─ app/
│  ├─ layout.jsx           # 根布局：引入全局样式、页面标题、zh-CN
│  ├─ page.jsx             # 唯一页面（'use client'）→ 渲染 src/App.jsx
│  └─ api/
│     ├─ tasks/route.js    # GET 取整表 / PUT 整表替换（事务）
│     └─ health/route.js   # {ok, store}
├─ src/                    # 界面层（与原单文件版逐字对齐的 CSS 与交互）
│  ├─ App.jsx              # 状态、云端同步、快捷键、弹层调度
│  ├─ index.css            # 全部样式（与原版一致）
│  ├─ components/          # 侧栏、顶栏、四视图、抽屉、两个弹窗、任务行、空态
│  └─ lib/                 # api.js 数据访问层 / constants / date / icons / tasks
├─ lib/
│  ├─ db.js                # Neon 连接池 + 建表（zhumo_users / zhumo_tasks·user_id）
│  ├─ users.js             # 用户表访问（scrypt 哈希、校验、增查）
│  ├─ auth.js              # 会话签名/校验（HMAC Cookie v2，绑定用户 id）
│  └─ store.js             # 任务存储：Neon（按 user_id 隔离），未配库降级 data/tasks.json
├─ tools/local-file-opener/  # zhumo-open:// 协议处理器（点文件名打开本机文件，见下）
├─ data/tasks.json         # 文件模式的数据（gitignore）
└─ .env.example
```

## 数据库（Neon）

本地不配置也能跑（自动用 `data/tasks.json`）。接 Neon：

1. 到 https://neon.tech 创建项目，复制连接串
2. `cp .env.example .env`，填 `DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require`
3. 重启；首次请求自动建表 `zhumo_tasks`（id text 主键 / idx 序号 / data jsonb）

```bash
curl http://localhost:3001/api/health
# {"ok":true,"store":"neon"}   ← 变成 neon 即接入成功
```

## API 契约

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | `{username, password}` 注册并直接登录（预留 `inviteCode` 字段，见下） |
| POST | `/api/auth/login` | `{username, password}` 登录 → 种 30 天 httpOnly 会话 Cookie |
| POST | `/api/auth/logout` | 清除会话 |
| GET | `/api/tasks` | 返回**当前用户**的任务数组；未登录 401 |
| PUT | `/api/tasks` | 当前用户整表替换（事务写入）；返回 `{ok, count, store}`；未登录 401 |
| GET | `/api/health` | `{ok, store}`，store 为 `neon` 或 `file`（不鉴权，供探活） |

校验：请求体必须是数组；每项须含非空 `title`、`due` 字符串；其余字段原样存取；上限 2000 条。

## 登录（用户表）

用户名 + 密码的多用户体系，数据按用户隔离（`zhumo_tasks.user_id`）：

- 表 `zhumo_users`：`id / username(唯一) / pwd_hash / role(预留admin) / created_at`；
  密码为 scrypt 加盐哈希（node 内置，零依赖）
- 会话为 HMAC 签名的 httpOnly Cookie（30 天），签名密钥 `AUTH_SECRET`（`.env` 随机值；
  未设置则从 DATABASE_URL 派生并告警——**部署 Vercel 务必显式设置**）
- 未登录访问页面 → 302 `/login`；API → 401（前端自动跳登录页）
- 登录页可切换 登录/注册；**首个注册的账号自动继承云端原有数据**（历史上无主的 `default` 任务）
- 顶栏 ⚙ 菜单显示当前用户，含「退出登录」；用户被删号后会话立即作废（页面层查库校验）
- 用户体系依赖 DATABASE_URL；纯本地文件模式（未配库）无登录，仅限本机开发

## 本地文件登记（不上传，点开即用）

任务和每个办理步骤都可以挂一列**本机文件**。设计原则：**文件本体永远留在自己电脑上，
系统只登记 `{名称, 路径, 登记时间}` 三样元数据**（随任务 JSON 走 Neon 云端同步，
换机器登录也能看到清单，但文件本体自然只在登记它的那台机器上）。

- 登记：详情抽屉「文件」区或某一步骤的 📎 里，粘贴完整路径回车（自动去引号、取文件名显示）
- 打开：点文件名 → `zhumo-open://<URL编码路径>` → 本机注册的处理脚本校验文件存在后，
  调系统默认程序打开。**每台机器只需装一次**：
  双击 `tools/local-file-opener/register-protocol.cmd`（写 HKCU，不需要管理员；
  想撤销运行 `unregister-protocol.cmd`）
- 没装处理器时点文件名没反应？用每行右侧的「复制路径」按钮，去资源管理器粘贴即可
- 安全设计（`zhumo-open.ps1`）：只接受盘符开头的绝对路径（拒绝 `C:evil` 盘相对形制、
  相对路径、URL），`Test-Path -LiteralPath` 确认存在才 `Start-Process`，文件不存在时静默不动
- 导出备份 JSON 时文件清单会一并带上；「移除」只删登记条目，绝不动本机文件

## 后台管理与邀请码（预留）

`zhumo_users.role` 列已就位（`'user'`，将来管理员为 `'admin'`）。启用邀请码注册时：

1. 新增后台管理路由（如 `app/admin/...`），按 `role='admin'` 放行，用于生成/吊销邀请码
2. 新增邀请码表（如 `zhumo_invites`：code / created_by / used_by / expires_at）
3. 把 `app/api/auth/register/route.js` 里的 `INVITE_REQUIRED` 改为 `true`，
   在标注的 TODO 处校验并消费邀请码；前端 `LoginForm` 注册模式加一个邀请码输入框
   （接口已按 `{username, password, inviteCode}` 预留字段）

## 部署 Vercel

- 本目录即一个 Vercel 项目（框架自动识别 Next.js，零配置）
- 环境变量必配两项：`DATABASE_URL`（Neon 连接串；Vercel 文件系统只读，文件模式不可用）、
  `AUTH_SECRET`（会话签名密钥，`openssl rand -hex 32` 生成；不配则从连接串派生，不建议）
- `ALLOWED_ORIGINS`、`NEXT_PUBLIC_API_BASE` 仅前后端分离部署时才需要，同源部署留空即可

## 验证要点（与原单文件版对齐）

- 今日视图：日期干支、四格统计、逾期与今日 / 未来七日分组、空态
- 看板：三列拖拽流转（HTML5 原生拖放）、办结卡片盖「结」印
- 清单：状态筛选 × 截止/优先级/进度排序；时间轴：按月翻页、今日红线、跨月任务条
- 详情抽屉：状态流转、步骤勾选自动推进度、办理记录、编辑/删除
- 弹窗：新建/修改校验（事项、截止日期必填）、导入/恢复确认
- 键盘：Esc 逐层关闭（菜单→确认→弹窗→抽屉）、Tab 焦点圈、方向键切换页签
- 数据：localStorage 键 `zhumo.desk.v1`（与单文件原版互通）；导出/导入 JSON、恢复示例数据

## 说明

- 登录为自研轻量方案（scrypt + HMAC Cookie），刻意未用 NextAuth：单服务、零额外依赖、可控；
  如日后要接入微信/SSO 登录，再评估迁移 NextAuth
- 注意：dev 服务器运行时不要执行 `npm run build`（会覆盖 `.next` 使 dev 进程损坏，需删除 `.next` 重启）

## 与 OpenDesign 工程的关系

上一级目录的 `index.html` 为 OpenDesign 工具跟踪的原始工件，保持原样未动；
本目录是它的全栈实现，localStorage 键相同，可互相接力使用。
（原 `zhumo-react` 纯前端变体已并入本项目后移除。）
