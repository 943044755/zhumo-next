import { useRef } from 'react';
import Icon from '../lib/icons.jsx';
import { CATS, CAT_ICON, TAB_META } from '../lib/constants.js';

export default function Topbar({ ui, cat, counts, onView, onCat, onQ, menuOpen, setMenuOpen, onNew, onExport, onImportFile, onSeed }) {
  const fileRef = useRef(null);

  const onTabKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = [...e.currentTarget.querySelectorAll('.tab')];
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    n.focus();
    onView(n.dataset.view);
  };

  const catEntries = [['all', '全部'], ...Object.entries(CATS).map(([k, c]) => [k, c.name])];

  return (
    <header className="topbar">
      <nav className="tabs" role="tablist" aria-label="视图" onKeyDown={onTabKey}>
        {Object.entries(TAB_META).map(([v, [ic, label]]) => (
          <button
            key={v} type="button" className="tab" role="tab" data-view={v}
            aria-selected={ui.view === v} aria-controls={'v-' + v} id={'tab-' + v}
            tabIndex={ui.view === v ? 0 : -1}
            onClick={() => onView(v)}
          >
            <Icon name={ic} /><span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="cats-m" aria-label="分类筛选">
        {catEntries.map(([k, n]) => (
          <button type="button" key={k} className="cat" aria-current={cat === k} onClick={() => onCat(k)}>
            <Icon name={CAT_ICON[k]} /><span>{n}</span><span className="cat-count">{counts[k] || 0}</span>
          </button>
        ))}
      </div>

      <label className="searchbox">
        <Icon name="search" />
        <input type="search" placeholder="搜索事项、步骤、备注" aria-label="搜索任务" onChange={(e) => onQ(e.target.value)} />
      </label>

      <button
        type="button" className="iconbtn menu-btn" aria-haspopup="true" aria-expanded={menuOpen}
        aria-label="数据与备份"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
      >
        <Icon name="gear" />
      </button>
      <div className="menu" hidden={!menuOpen}>
        <button type="button" onClick={() => { setMenuOpen(false); onExport(); }}>
          <Icon name="download" />导出备份 JSON
        </button>
        <button type="button" onClick={() => { setMenuOpen(false); fileRef.current && fileRef.current.click(); }}>
          <Icon name="upload" />导入备份
        </button>
        <button type="button" onClick={() => { setMenuOpen(false); onSeed(); }}>
          <Icon name="lamp" />恢复示例数据
        </button>
      </div>

      <button type="button" className="btn-new" onClick={onNew}>
        <Icon name="plus" /><span>记一件事</span>
      </button>

      <input
        ref={fileRef} type="file" accept="application/json,.json" hidden
        onChange={(e) => { if (e.target.files[0]) onImportFile(e.target.files[0]); e.target.value = ''; }}
      />
    </header>
  );
}
