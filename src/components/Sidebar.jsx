import Icon from '../lib/icons.jsx';
import { CATS, CAT_ICON } from '../lib/constants.js';

export default function Sidebar({ tasks, counts, cat, onCat }) {
  const done = tasks.filter((t) => t.status === 'done').length;
  /* 原版此处误将分类对象直接拼进 HTML（显示为 [object Object]），按设计意图取 name */
  const entries = [['all', '全部'], ...Object.entries(CATS).map(([k, c]) => [k, c.name])];
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-seal" aria-hidden="true">朱</span>
        <div><h1>朱墨案头</h1><small>待办工作台 · 个人版</small></div>
      </div>
      <nav className="cats" aria-label="事项分类">
        {entries.map(([k, n]) => (
          <button type="button" key={k} className="cat" aria-current={cat === k} onClick={() => onCat(k)}>
            <Icon name={CAT_ICON[k]} /><span>{n}</span><span className="cat-count">{counts[k] || 0}</span>
          </button>
        ))}
      </nav>
      <div className="side-foot">
        <span className="motto" aria-hidden="true">今日事今日毕</span>
        <div className="tally" aria-label="统计">已记 <b>{tasks.length}</b> 事<br />办结 <b>{done}</b> 件</div>
      </div>
    </aside>
  );
}
