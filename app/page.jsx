'use client';

import App from '../src/App.jsx';

/* 全站唯一页面：整个应用（含四个视图、抽屉、弹窗）都跑在客户端，
   'use client' 标在入口即可，被引入的组件自动归入客户端包。 */
export default function Page() {
  return <App />;
}
