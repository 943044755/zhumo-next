import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 纯 API 服务：无页面路由，仅 app/api/**。部署 Vercel 时零配置。
  // 锁定 workspace 根为本目录（机器上存在多个 package-lock.json 时避免 Next 误判）。
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
};

export default nextConfig;
