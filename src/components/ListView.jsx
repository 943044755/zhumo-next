import TaskRow from './TaskRow.jsx';
import Empty from './Empty.jsx';
import { prog } from '../lib/tasks.js';

export default function ListView({ tasks, ui, onUi, onTick, onOpen, onNew }) {
  let ts = tasks;
  if (ui.status !== 'all') ts = ts.filter((t) => t.status === ui.status);
  const cmp = {
    due: (a, b) => a.due < b.due ? -1 : 1,
    prio: (a, b) => a.priority - b.priority || (a.due < b.due ? -1 : 1),
    prog: (a, b) => prog(b) - prog(a),
  }[ui.sort];
  ts = [...ts].sort(cmp);
  return (
    <section className="view" id="v-list" role="tabpanel" aria-labelledby="tab-list" tabIndex={-1} hidden={ui.view !== 'list'}>
      <div className="vhead">
        <h2>清单</h2>
        <div className="vh-act">
          <select className="btn-ghost" aria-label="按状态筛选" value={ui.status} onChange={(e) => onUi({ status: e.target.value })}>
            <option value="all">全部状态</option>
            <option value="todo">未开始</option>
            <option value="doing">进行中</option>
            <option value="done">已办结</option>
          </select>
          <select className="btn-ghost" aria-label="排序方式" value={ui.sort} onChange={(e) => onUi({ sort: e.target.value })}>
            <option value="due">按截止日期</option>
            <option value="prio">按优先级</option>
            <option value="prog">按进度</option>
          </select>
        </div>
      </div>
      <div className="tlist">
        {ts.length > 0
          ? ts.map((t) => <TaskRow key={t.id} t={t} layout="lrow" onTick={onTick} onOpen={onOpen} />)
          : <Empty icon="list" kai="无此一类" text="没有符合筛选条件的事项，换个筛选或新增一件。" withNew onNew={onNew} />}
      </div>
    </section>
  );
}
