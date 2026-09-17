import Icon from '../lib/icons.jsx';
import Empty from './Empty.jsx';
import { CATS } from '../lib/constants.js';
import { TODAY, iso, parseD, daysLeft, fmtD, fmtEst } from '../lib/date.js';

export default function TimelineView({ tasks, ui, onUi, onOpen }) {
  const base = new Date(); base.setDate(1); base.setHours(12, 0, 0, 0);
  const first = new Date(base.getFullYear(), base.getMonth() + ui.month, 1);
  const y = first.getFullYear(), m = first.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const mStart = iso(first), mEnd = iso(new Date(y, m, days, 12));
  const rows = tasks.filter((t) => t.start <= mEnd && t.due >= mStart).sort((a, b) => a.due < b.due ? -1 : 1);
  const todayD = parseD(TODAY);
  const todayIn = todayD.getFullYear() === y && todayD.getMonth() === m;
  const todayLeft = (todayD.getDate() - 0.5) / days * 100;

  return (
    <section className="view" id="v-tl" role="tabpanel" aria-labelledby="tab-tl" tabIndex={-1} hidden={ui.view !== 'tl'}>
      <div className="vhead">
        <h2>时间轴</h2>
        <span className="sub">每件事的起止与耗时，一眼看清</span>
      </div>
      <div className="tl-head">
        <button className="iconbtn" aria-label="上一月" onClick={() => onUi({ month: ui.month - 1 })}><Icon name="chevL" /></button>
        <div className="tl-title">{y}年{m + 1}月</div>
        <button className="iconbtn" aria-label="下一月" onClick={() => onUi({ month: ui.month + 1 })}><Icon name="chevR" /></button>
        <button className="btn-ghost" hidden={ui.month === 0} onClick={() => onUi({ month: 0 })}>回到本月</button>
      </div>
      <div className="tl-grid">
        <div className="tl-scale">
          <span></span>
          <div className="cells">
            {[1, 8, 15, 22, days].map((dd) => (
              <span key={dd} style={{ left: ((dd - 0.5) / days * 100) + '%' }}>{dd}</span>
            ))}
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="tl-empty"><Empty icon="tl" kai="此月无账" text="本月时间轴上没有跨入的事项，翻翻前后月份。" /></div>
        ) : rows.map((t) => {
          const s = parseD(t.start), e = parseD(t.due);
          const sDay = s.getFullYear() === y && s.getMonth() === m ? s.getDate() : 1;
          const eDay = e.getFullYear() === y && e.getMonth() === m ? e.getDate() : days;
          const left = (sDay - 1) / days * 100;
          const width = Math.max((eDay - sDay + 1) / days * 100, 1.4);
          const cls = t.status === 'done' ? 'done' : (t.status !== 'done' && daysLeft(t.due) < 0 ? 'over' : '');
          const est = t.est ? fmtEst(t.est) : '';
          return (
            <div className="tl-row" key={t.id}>
              <div className="tl-label">
                <button
                  type="button" className="t-title"
                  style={{ all: 'unset', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                  onClick={() => onOpen(t.id)}
                >{t.title}</button>
                <div className="t-range">{CATS[t.cat].name} · {fmtD(t.start)} — {fmtD(t.due)} · {est}</div>
              </div>
              <div className="tl-track">
                {todayIn && <span className="tl-today" style={{ left: todayLeft + '%' }} aria-hidden="true"></span>}
                <span
                  className={'tl-bar ' + cls} style={{ left: left + '%', width: width + '%' }}
                  title={t.title} role="img" aria-label={t.title + '：' + fmtD(t.start) + '至' + fmtD(t.due)}
                ></span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
