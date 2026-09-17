import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import TodayView from './components/TodayView.jsx';
import BoardView from './components/BoardView.jsx';
import ListView from './components/ListView.jsx';
import TimelineView from './components/TimelineView.jsx';
import Drawer from './components/Drawer.jsx';
import TaskModal from './components/TaskModal.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import { loadTasks, saveTasks, fetchRemoteTasks, pushRemoteTasks } from './lib/api.js';
import { seedData, newId, normalize, log as addLog } from './lib/tasks.js';
import { TODAY } from './lib/date.js';
import { CATS, STATUS } from './lib/constants.js';

export default function App() {
  /* Next.js 会在服务端预渲染本组件（无 localStorage，日期时区也可能与客户端不同）：
     首帧统一渲染空壳，挂载后再读本地快照/云端，避免水合不一致。 */
  const [tasks, setTasks] = useState(null);
  const [ui, setUi] = useState({ view: 'today', cat: 'all', q: '', status: 'all', sort: 'due', month: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerId, setDrawerId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalId, setModalId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // { title, text, onOk }
  const [toastMsg, setToastMsg] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const [stampTaskId, setStampTaskId] = useState(null);

  const lastFocus = useRef(null);
  const toastTimer = useRef(null);
  const drawerRootRef = useRef(null);
  const dlgRef = useRef(null);
  const confirmRootRef = useRef(null);
  /* 云端同步（Next.js 后端 /api/tasks · Neon）。后端不可达时自动降级为本地 localStorage。 */
  const tasksRef = useRef(tasks);
  const cloudReadyRef = useRef(false); // 首次拉取是否已结束（无论成败）
  const dirtyRef = useRef(false);      // 拉取结束前有过本地改动
  const cloudWarnedRef = useRef(false);

  /* —— 持久化 / 提示 —— */
  const showToast = (msg) => {
    setToastMsg(msg); setToastShow(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 1900);
  };
  const syncUp = (next) => {
    pushRemoteTasks(next).then((ok) => {
      if (!ok && !cloudWarnedRef.current) {
        cloudWarnedRef.current = true;
        showToast('云端暂不可达，改动已保存在本地');
      }
    });
  };
  const persist = (next) => {
    setTasks(next);
    tasksRef.current = next;
    if (!saveTasks(next)) showToast('本地存储不可用，改动仅保留在当前页');
    if (cloudReadyRef.current) syncUp(next);
    else dirtyRef.current = true;
  };
  /* 挂载后加载数据：本地快照秒出（没有则用示例数据），再异步拉云端；
     云端为空库、或拉取期间有过本地改动 → 把本地整表推上云；云端有数据 → 以云端为准 */
  useEffect(() => {
    const local = loadTasks() || seedData();
    tasksRef.current = local;
    setTasks(local);
    saveTasks(local);
    let alive = true;
    (async () => {
      const remote = await fetchRemoteTasks();
      if (!alive) return;
      cloudReadyRef.current = true;
      if (remote === null) return;                 // 后端不可达 → 本地模式
      if (dirtyRef.current || remote.length === 0) {
        syncUp(tasksRef.current);                  // 拉取期间有过改动 / 空库首连：本地上云
        return;
      }
      tasksRef.current = remote;
      setTasks(remote);
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line

  const patchUi = (patch) => setUi((u) => ({ ...u, ...patch }));

  /* —— 派生 —— */
  const byId = (id) => tasks.find((t) => t.id === id);
  const matchQ = (t) => {
    if (!ui.q) return true;
    const q = ui.q.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) ||
      t.steps.some((s) => s.t.toLowerCase().includes(q));
  };
  const scoped = useMemo(() => (tasks || []).filter((t) => (ui.cat === 'all' || t.cat === ui.cat) && matchQ(t)), [tasks, ui.cat, ui.q]); // eslint-disable-line
  const counts = useMemo(() => {
    const ts = tasks || [];
    const c = { all: ts.length };
    for (const k in CATS) c[k] = ts.filter((t) => t.cat === k).length;
    return c;
  }, [tasks]);

  /* —— 状态流转 —— */
  const setStatus = (id, st) => {
    const t = byId(id);
    if (!t || t.status === st) return;
    const wasDone = t.status === 'done', from = t.status;
    const nt = { ...t, status: st, log: [...t.log] };
    if (st === 'done') { nt.doneAt = Date.now(); nt.log.push({ ts: Date.now(), text: '办结归档' }); }
    else { if (wasDone) nt.doneAt = null; nt.log.push({ ts: Date.now(), text: '状态：' + STATUS[from] + ' → ' + STATUS[st] }); }
    persist(tasks.map((x) => (x.id === id ? nt : x)));
    if (drawerOpen && drawerId === id && st === 'done' && !wasDone) setStampTaskId(id);
    showToast(st === 'done' ? '已办结 · 朱印归档' : st === 'doing' ? '已开始办理' : '已移回未开始');
  };
  const tick = (id) => {
    const t = byId(id);
    if (t) setStatus(id, t.status === 'done' ? 'doing' : 'done');
  };
  const setProg = (id, v) => {
    const t = byId(id);
    if (!t) return;
    const p = Math.max(0, Math.min(100, Math.round(v)));
    if (p === 100 && t.status !== 'done') { setStatus(id, 'done'); return; }
    persist(tasks.map((x) => (x.id === id ? { ...x, progress: p } : x)));
  };
  const toggleStep = (id, idx) => {
    const t = byId(id);
    if (!t || !t.steps[idx]) return;
    const steps = t.steps.map((s, i) => (i === idx ? { ...s, done: !s.done } : s));
    const nt = { ...t, steps, log: [...t.log] };
    if (t.status === 'todo' && steps[idx].done) { nt.status = 'doing'; nt.log.push({ ts: Date.now(), text: '状态：未开始 → 进行中' }); }
    if (steps.every((s) => s.done) && t.status !== 'done') {
      nt.log.push({ ts: Date.now(), text: '步骤全部完成' });
      showToast('步骤已全勾，可点「办结」盖章');
    }
    persist(tasks.map((x) => (x.id === id ? nt : x)));
  };
  const addStep = (id, text) => {
    const t = byId(id);
    if (!t || !text) return;
    const nt = { ...t, steps: [...t.steps, { t: text, done: false }], log: [...t.log] };
    nt.log.push({ ts: Date.now(), text: '新增步骤：' + text });
    persist(tasks.map((x) => (x.id === id ? nt : x)));
  };
  const delStep = (id, idx) => {
    const t = byId(id);
    if (!t || !t.steps[idx]) return;
    const nt = { ...t, steps: t.steps.filter((_, i) => i !== idx), log: [...t.log] };
    nt.log.push({ ts: Date.now(), text: '删除步骤：' + t.steps[idx].t });
    persist(tasks.map((x) => (x.id === id ? nt : x)));
  };
  const addNote = (id, text) => {
    const t = byId(id);
    if (!t || !text) return;
    const nt = { ...t, log: [...t.log, { ts: Date.now(), text }] };
    persist(tasks.map((x) => (x.id === id ? nt : x)));
    showToast('已记一笔');
  };
  const delTask = (id) => {
    const t = byId(id);
    if (!t) return;
    confirmDlg('删除「' + t.title + '」？', '删除后不可恢复。若只想归档，建议改判「办结」。', () => {
      persist(tasks.filter((x) => x.id !== id));
      closeDrawer();
      showToast('已删除');
    });
  };

  /* —— 表单保存（新建 / 修改） —— */
  const saveForm = (fields) => {
    if (modalId) {
      const t = byId(modalId);
      if (!t) { closeModal(); return; }
      const keepDone = t.steps.length
        ? fields.steps.map((s, i) => ({ t: s.t, done: (t.steps[i] || {}).done || false }))
        : fields.steps;
      const nt = normalize({ ...t, ...fields, steps: keepDone, log: [...t.log] });
      if (nt.steps.length && nt.steps.every((s) => s.done) && nt.status !== 'done') nt.status = 'doing';
      nt.log.push({ ts: Date.now(), text: '修改了事项内容' });
      persist(tasks.map((x) => (x.id === nt.id ? nt : x)));
      showToast('已修改');
    } else {
      const nt = normalize({ id: newId(), status: 'todo', progress: 0, notes: '', ...fields });
      nt.log = [{ ts: Date.now(), text: '建账立卡' }];
      persist([nt, ...tasks]);
      showToast('已记入案头');
    }
    closeModal();
  };

  /* —— 备份 —— */
  const doExport = () => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '朱墨案头备份-' + TODAY.replace(/-/g, '') + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 800);
    showToast('备份已导出');
  };
  const doImport = (file) => {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const a = JSON.parse(rd.result);
        if (!Array.isArray(a) || !a.every((x) => x && x.title && x.due)) throw 0;
        confirmDlg('导入备份？', '将覆盖现有 ' + tasks.length + ' 件事项，导入 ' + a.length + ' 件。', () => {
          const next = a.map(normalize);
          persist(next);
          showToast('已导入 ' + next.length + ' 件');
        });
      } catch { showToast('文件格式不对，请选择本工具导出的 JSON'); }
    };
    rd.readAsText(file, 'utf-8');
  };
  const doSeed = () => {
    confirmDlg('恢复示例数据？', '当前 ' + tasks.length + ' 件事项将被示例数据覆盖。可先「导出备份」留底。', () => {
      persist(seedData());
      showToast('已恢复示例数据');
    });
  };

  /* —— 抽屉 / 弹层开关（含焦点归还） —— */
  const restoreFocus = () => {
    const el = lastFocus.current;
    if (el && el.isConnected) el.focus();
  };
  const openDrawer = (id) => {
    if (!byId(id)) return;
    lastFocus.current = document.activeElement;
    setStampTaskId(null);
    setDrawerId(id);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    if (!drawerOpen) return;
    setDrawerOpen(false);
    setDrawerId(null);
    restoreFocus();
  };
  const openModal = (id) => {
    lastFocus.current = document.activeElement;
    setModalId(id || null);
    setModalOpen(true);
  };
  const closeModal = () => {
    if (!modalOpen) return;
    setModalOpen(false);
    setModalId(null);
    restoreFocus();
  };
  const confirmDlg = (title, text, onOk) => {
    lastFocus.current = document.activeElement;
    setConfirm({ title, text, onOk });
  };
  const closeConfirm = () => {
    if (!confirm) return;
    setConfirm(null);
    restoreFocus();
  };
  const onConfirmOk = () => {
    const cb = confirm && confirm.onOk;
    setConfirm(null);
    restoreFocus();
    if (cb) cb();
  };

  /* —— 全局键盘：Esc 逐层关闭 + 焦点圈 —— */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (menuOpen) { setMenuOpen(false); return; }
        if (confirm) { closeConfirm(); return; }
        if (modalOpen) { closeModal(); return; }
        if (drawerOpen) closeDrawer();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = confirm ? confirmRootRef.current
        : modalOpen ? dlgRef.current
        : drawerOpen ? drawerRootRef.current : null;
      if (!root) return;
      const f = [...root.querySelectorAll('button,input,select,textarea,a[href]')]
        .filter((x) => !x.disabled && !x.hidden && x.tabIndex >= 0 && (x.offsetParent !== null || x === root));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }); // 每次渲染重挂，闭包始终最新（规模小，代价可忽略）

  /* —— 点击空白关闭菜单 —— */
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (!e.target.closest('.menu-wrap')) setMenuOpen(false); };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [menuOpen]);

  /* —— 抽屉打开时锁定页面滚动 —— */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* 数据尚未加载（服务端预渲染 / 挂载后首帧）：渲染空壳，说明见 tasks 初始化处 */
  if (tasks === null) return null;

  return (
    <>
      <a className="skip" href="#vanchor">跳到主内容</a>
      <div className="app">
        <Sidebar tasks={tasks} counts={counts} cat={ui.cat} onCat={(cat) => patchUi({ cat })} />
        <div className="mainwrap" id="vanchor">
          <Topbar
            ui={ui} cat={ui.cat} counts={counts}
            onView={(view) => patchUi({ view })}
            onCat={(cat) => patchUi({ cat })}
            onQ={(q) => patchUi({ q: q.trim() })}
            menuOpen={menuOpen} setMenuOpen={setMenuOpen}
            onNew={() => openModal(null)}
            onExport={doExport}
            onImportFile={doImport}
            onSeed={doSeed}
          />
          <main className="views">
            <TodayView tasks={scoped} ui={ui} onTick={tick} onOpen={openDrawer} onNew={() => openModal(null)} />
            <BoardView tasks={scoped} ui={ui} onStatus={setStatus} onOpen={openDrawer} />
            <ListView tasks={scoped} ui={ui} onUi={patchUi} onTick={tick} onOpen={openDrawer} onNew={() => openModal(null)} />
            <TimelineView tasks={scoped} ui={ui} onUi={patchUi} onOpen={openDrawer} />
          </main>
        </div>
      </div>

      <div className={'scrim' + (drawerOpen ? ' show' : '')} onClick={closeDrawer}></div>
      <Drawer
        open={drawerOpen} task={drawerId ? byId(drawerId) : null}
        stamp={!!drawerId && stampTaskId === drawerId}
        onClose={closeDrawer} rootRef={drawerRootRef}
        onStatus={setStatus} onProg={setProg} onToggleStep={toggleStep}
        onAddStep={addStep} onDelStep={delStep} onNote={addNote}
        onEdit={(id) => { closeDrawer(); openModal(id); }}
        onDel={delTask}
      />

      <TaskModal
        open={modalOpen} task={modalId ? byId(modalId) : null}
        onSave={saveForm} onClose={closeModal} dlgRef={dlgRef}
      />

      <ConfirmModal confirm={confirm} onClose={closeConfirm} onOk={onConfirmOk} rootRef={confirmRootRef} />

      <div className={'toast' + (toastShow ? ' show' : '')} role="status" aria-live="polite">{toastMsg}</div>
    </>
  );
}
