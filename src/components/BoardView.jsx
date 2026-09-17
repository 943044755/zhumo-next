import { useState } from 'react';
import { CATS, PRIO, COLS } from '../lib/constants.js';
import { dueBadge } from '../lib/date.js';
import { prog } from '../lib/tasks.js';

export default function BoardView({ tasks, ui, onStatus, onOpen }) {
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  return (
    <section className="view" id="v-board" role="tabpanel" aria-labelledby="tab-board" tabIndex={-1} hidden={ui.view !== 'board'}>
      <div className="vhead">
        <h2>看板</h2>
        <span className="sub">拖动卡片流转 · 点开卡片办理</span>
      </div>
      <div className="board">
        {COLS.map(([st, label, dot]) => {
          const col = tasks.filter((t) => t.status === st).sort((a, b) => a.due < b.due ? -1 : 1);
          return (
            <section
              key={st} className={'bcol' + (overCol === st ? ' dragover' : '')} data-col={st} aria-label={label}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(st); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOverCol((c) => (c === st ? null : c)); }}
              onDrop={(e) => {
                e.preventDefault();
                setOverCol(null);
                const id = e.dataTransfer.getData('text/plain') || dragId;
                setDragId(null);
                if (id) onStatus(id, st);
              }}
            >
              <div className="bcol-h"><span className="dotmk" style={{ background: dot }}></span>{label}<span className="n">{col.length}</span></div>
              <div className="bcol-body" data-drop={st}>
                {col.length > 0 ? col.map((t) => {
                  const b = dueBadge(t), p = PRIO[t.priority], pr = prog(t);
                  return (
                    <article
                      key={t.id} className={'bcard' + (t.status === 'done' ? ' done' : '') + (dragId === t.id ? ' dragging' : '')}
                      draggable
                      onDragStart={(e) => { setDragId(t.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    >
                      {t.status === 'done' && <span className="seal" aria-hidden="true">结</span>}
                      <button type="button" className="t-main" onClick={() => onOpen(t.id)}>
                        <span className="t-title">{t.title}</span>
                        <span className="t-meta">
                          <span className={'prio ' + p.cls} title={'优先级' + p.name}>{p.name}</span>
                          <span className={'chip ' + CATS[t.cat].cls}>{CATS[t.cat].name}</span>
                          <span className={b.cls}>{b.text}</span>
                          <span className="mini-bar" aria-hidden="true"><i className={pr >= 100 ? 'full' : ''} style={{ width: pr + '%' }}></i></span>
                        </span>
                      </button>
                    </article>
                  );
                }) : (
                  <div className="bcol-empty">{st === 'todo' ? '暂无 · 点右上「记一件事」' : '将卡片拖到这里'}</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
