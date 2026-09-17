import { CATS, PRIO } from '../lib/constants.js';
import { dueBadge, fmtEst } from '../lib/date.js';
import { prog } from '../lib/tasks.js';

/* 今日 / 清单共用的任务行；layout='lrow' 时为清单网格 */
export default function TaskRow({ t, layout, onTick, onOpen }) {
  const b = dueBadge(t), p = PRIO[t.priority], pr = prog(t);
  const doneCount = t.steps.filter((s) => s.done).length;
  return (
    <div className={'trow' + (layout ? ' ' + layout : '') + (t.status === 'done' ? ' done' : '')} data-row={t.id}>
      <button
        type="button" className="tick"
        aria-label={(t.status === 'done' ? '重新打开' : '标记办结') + '：' + t.title}
        aria-pressed={t.status === 'done'}
        onClick={() => onTick(t.id)}
      ></button>
      <button type="button" className="t-main" onClick={() => onOpen(t.id)}>
        <span className="t-title">{t.title}</span>
        <span className="t-meta">
          <span className={'chip ' + CATS[t.cat].cls}>{CATS[t.cat].name}</span>
          <span>{fmtEst(t.est)}</span>
          {t.steps.length > 0 && (
            <>
              <span className="sep" aria-hidden="true"></span>
              <span>步骤 {doneCount}/{t.steps.length}</span>
            </>
          )}
          {t.notes ? (
            <>
              <span className="sep" aria-hidden="true"></span>
              <span className="od-trunc" title={t.notes}>{t.notes}</span>
            </>
          ) : null}
        </span>
      </button>
      <div className="t-side">
        <span className={'t-due ' + b.cls}>{b.text}</span>
        <span className="mini-bar" aria-hidden="true"><i className={pr >= 100 ? 'full' : ''} style={{ width: pr + '%' }}></i></span>
      </div>
    </div>
  );
}
