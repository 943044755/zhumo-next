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

数据策略为「云端优先、本地兜底」：打开页面先取本地快照秒显，同时拉 `/api/tasks`；
每次改动整表 PUT 上云；后端不可达时自动降级 localStorage（键 `zhumo.desk.v1`，与单文件原版数据互通），
恢复后继续上云。

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
├─ lib/store.js            # 服务端存储：Neon Postgres，未配库则降级 data/tasks.json
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
| GET | `/api/tasks` | 返回任务数组（按保存顺序） |
| PUT | `/api/tasks` | 请求体=任务数组，整表替换（事务写入）；返回 `{ok, count, store}` |
| GET | `/api/health` | `{ok, store}`，store 为 `neon` 或 `file` |

校验：请求体必须是数组；每项须含非空 `title`、`due` 字符串；其余字段原样存取；上限 2000 条。

## 部署 Vercel

- 本目录即一个 Vercel 项目（框架自动识别 Next.js，零配置）
- 环境变量必配 `DATABASE_URL`（Vercel 文件系统只读，文件模式不可用）；
  `ALLOWED_ORIGINS`、`NEXT_PUBLIC_API_BASE` 仅前后端分离部署时才需要，同源部署留空即可

## 验证要点（与原单文件版对齐）

- 今日视图：日期干支、四格统计、逾期与今日 / 未来七日分组、空态
- 看板：三列拖拽流转（HTML5 原生拖放）、办结卡片盖「结」印
- 清单：状态筛选 × 截止/优先级/进度排序；时间轴：按月翻页、今日红线、跨月任务条
- 详情抽屉：状态流转、步骤勾选自动推进度、办理记录、编辑/删除
- 弹窗：新建/修改校验（事项、截止日期必填）、导入/恢复确认
- 键盘：Esc 逐层关闭（菜单→确认→弹窗→抽屉）、Tab 焦点圈、方向键切换页签
- 数据：localStorage 键 `zhumo.desk.v1`（与单文件原版互通）；导出/导入 JSON、恢复示例数据

## 说明

- 暂无鉴权（个人工具定位）。如需多端登录，建议在 Neon 加 users 表 + NextAuth/Clerk，属后续迭代
- 注意：dev 服务器运行时不要执行 `npm run build`（会覆盖 `.next` 使 dev 进程损坏，需删除 `.next` 重启）

## 与 OpenDesign 工程的关系

上一级目录的 `index.html` 为 OpenDesign 工具跟踪的原始工件，保持原样未动；
本目录是它的全栈实现，localStorage 键相同，可互相接力使用。
（原 `zhumo-react` 纯前端变体已并入本项目后移除。）
