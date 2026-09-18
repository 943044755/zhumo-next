'use client';

import { useRef, useState } from 'react';

/* 登录/注册卡片：样式沿用全站设计令牌（宣纸底、朱砂印、楷体）。
   预留：后台管理启用邀请码后，注册模式在此加一个「邀请码」输入框即可，
   接口已按 { username, password, inviteCode } 预留字段。 */
export default function LoginForm() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);

  const shake = () => {
    const el = cardRef.current;
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth; // 重触发动画
    el.classList.add('shake');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const f = e.target.elements;
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: f.username.value, password: f.password.value }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        window.location.replace('/');
        return;
      }
      setErr(data.error || '请求失败（' + r.status + '）');
      shake();
    } catch {
      setErr('网络异常，请重试');
      shake();
    } finally {
      setBusy(false);
    }
  };

  const isReg = mode === 'register';
  return (
    <div className="login-wrap">
      <div className="login-card" ref={cardRef}>
        <div className="login-seal" aria-hidden="true">朱</div>
        <h1 className="login-title">朱墨案头</h1>
        <p className="login-sub">体制内个人待办工作台 · {isReg ? '注册新账号' : '请登录'}</p>
        <form className="login-field" onSubmit={onSubmit}>
          <input
            name="username" type="text" placeholder="用户名" aria-label="用户名"
            autoComplete="username" maxLength={24} autoFocus required
          />
          <input
            name="password" type="password" placeholder={isReg ? '设置密码（至少 6 位）' : '密码'}
            aria-label="密码" autoComplete={isReg ? 'new-password' : 'current-password'} required
          />
          <button className="login-btn" type="submit" disabled={busy}>
            {isReg ? '注 册' : '登 录'}
          </button>
          <p className="login-err" role="alert">{err}</p>
        </form>
        <p className="login-switch">
          {isReg ? '已有账号？' : '还没有账号？'}
          <button
            type="button" onClick={() => { setMode(isReg ? 'login' : 'register'); setErr(''); }}
          >
            {isReg ? '返回登录' : '注册一个'}
          </button>
        </p>
      </div>
    </div>
  );
}
