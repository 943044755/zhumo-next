import TaskRow from './TaskRow.jsx';
import Empty from './Empty.jsx';
import { TODAY, parseD, daysLeft, weekCN, ganzhi } from '../lib/date.js';

export default function TodayView({ tasks, ui, onTick, onOpen, onNew }) {
  const d = parseD(TODAY);
  const open = tasks.filter((t) => t.status !== 'done');
  const over = open.filter((t) => daysLeft(t.due) < 0);
  const tdY = open.filter((t) => daysLeft(t.due) === 0);
  const week = open.filter((t) => { const dl = daysLeft(t.due); return dl > 0 && dl <= 7; });
  const doing = tasks.filter((t) => t.status === 'doing');
  const g1 = [...over, ...tdY].sort((a, b) => a.due < b.due ? -1 : 1);
  const g2 = [...week].sort((a, b) => a.due < b.due ? -1 : 1);
  return (
    <section className="view" id="v-today" role="tabpanel" aria-labelledby="tab-today" tabIndex={-1} hidden={ui.view !== 'today'}>
      <div className="date-hero">
        <h2 className="d-date">{d.getFullYear()}年{d.getMonth() + 1}月{d.getDate()}日</h2>
        <span className="d-week">{weekCN(TODAY)} · {ganzhi(d.getFullYear())}</span>
        <span className="d-motto">案无留牍 · 事有始终</span>
      </div>
      <div className="stats">
        <div className="stat s-red"><b>{tdY.length}</b><span>今日到期</span></div>
        <div className="stat s-red"><b>{over.length}</b><span>已逾期</span></div>
        <div className="stat s-indigo"><b>{doing.length}</b><span>进行中</span></div>
        <div className="stat s-ochre"><b>{week.length}</b><span>七日内截止</span></div>
      </div>
      {g1.length > 0 && (
        <div>
          <h3 className="group-h">逾期与今日<span className="n">{g1.length} 件</span></h3>
          <div className="tlist">{g1.map((t) => <TaskRow key={t.id} t={t} onTick={onTick} onOpen={onOpen} />)}</div>
        </div>
      )}
      {g2.length > 0 && (
        <div>
          <h3 className="group-h">未来七日<span className="n">{g2.length} 件</span></h3>
          <div className="tlist">{g2.map((t) => <TaskRow key={t.id} t={t} onTick={onTick} onOpen={onOpen} />)}</div>
        </div>
      )}
      {g1.length === 0 && g2.length === 0 && (
        <Empty icon="bell" kai="案无留牍" text="今日没有到期或逾期的事项，去清单翻翻手头的事。" withNew onNew={onNew} />
      )}
    </section>
  );
}
