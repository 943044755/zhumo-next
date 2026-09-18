import { useEffect, useRef, useState } from 'react';
import Icon from '../lib/icons.jsx';
import { CATS, PRIO, STATUS } from '../lib/constants.js';
import { dueBadge, fmtD, fmtEst, pad } from '../lib/date.js';
import { prog } from '../lib/tasks.js';

/* 详情抽屉。关闭时保留最后内容，保证滑出动画期间内容不消失（与原版一致）。 */

/* 一行已登记的文件：点文件名经 zhumo-open:// 调本机默认程序打开；另给复制路径/移除。
   文件本体始终留在本机，这里只维护「登记条目」。 */
function FileRow({ f, onOpenFile, onCopyPath, onDel, delLabel }) {
  return (
    <div className="file-i">
      <button type="button" className="file-open" title={f.path} onClick={() => onOpenFile(f)}>{f.name}</button>
      <button type="button" className="iconbtn" aria-label={'复制路径：' + f.name} title="复制完整路径" onClick={() => onCopyPath(f)}><Icon name="copy" /></button>
      <button type="button" className="iconbtn" aria-label={delLabel + f.name} title="从登记中移除（不动本机文件）" onClick={onDel}><Icon name="x" /></button>
    </div>
  );
}

/* 步骤文件展开区里的登记表单（独立状态，多步互不串值） */
function StepFileAdd({ onAdd }) {
  const [v, setV] = useState('');
  return (
    <form className="addline" onSubmit={(e) => { e.preventDefault(); const x = v.trim(); if (x) { onAdd(x); setV(''); } }}>
      <input type="text" maxLength={300} placeholder="粘贴本机文件路径，回车登记到这一步" aria-label="登记步骤文件路径" value={v} onChange={(e) => setV(e.target.value)} />
      <button type="submit" className="btn-ghost">登记</button>
    </form>
  );
}

export default function Drawer({ open, task, stamp, onClose, onStatus, onProg, onToggleStep, onAddStep, onDelStep, onNote, onAddFile, onDelFile, onCopyPath, onOpenFile, onEdit, onDel, rootRef }) {
  const lastRef = useRef(null);
  const t = task || lastRef.current;
  useEffect(() => { if (task) lastRef.current = task; }, [task]);

  const bodyRef = useRef(null);
  const closeRef = useRef(null);
  const [stepText, setStepText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [fileText, setFileText] = useState('');
  const [openStep, setOpenStep] = useState(null); // 展开了文件列表的步骤下标

  useEffect(() => {
    if (open) {
      bodyRef.current.scrollTop = 0;
      closeRef.current.focus();
    } else {
      setOpenStep(null);
    }
  }, [open]);

  if (!t) return <aside className="drawer" ref={rootRef}></aside>;

  const p = PRIO[t.priority], b = dueBadge(t), pr = prog(t);
  const doneSteps = t.steps.filter((s) => s.done).length;

  return (
    <aside className={'drawer' + (open ? ' show' : '')} role="dialog" aria-modal="true" aria-labelledby="dwTitle" ref={rootRef}>
      <header className="dw-head">
        <div className="dw-kicker">
          <span className={'chip ' + CATS[t.cat].cls}>{CATS[t.cat].name}</span>
          <span className={'prio ' + p.cls} title="优先级">{p.name}</span>
          <span style={{ fontSize: '12px', color: 'var(--ink-2)' }}>{STATUS[t.status]}</span>
        </div>
        <h2 id="dwTitle">{t.title}</h2>
        <button className="iconbtn dw-close" ref={closeRef} aria-label="关闭详情" onClick={onClose}><Icon name="x" /></button>
      </header>
      <div className="dw-body" ref={bodyRef}>
        <div className="d-sec">
          <div className="strow">
            {['todo', 'doing', 'done'].map((st) => (
              <button
                type="button" key={st}
                className={'stbtn' + (st === 'done' ? ' fn-done' : '') + (t.status === st ? ' cur' : '')}
                aria-current={t.status === st}
                onClick={() => onStatus(t.id, st)}
              >{st === 'done' && t.status !== st ? '办结' : STATUS[st]}</button>
            ))}
          </div>
        </div>

        <div className="d-sec">
          <div className="meta-grid">
            <div className="m-item"><label>截止</label><b className={b.cls === 'due-over' ? 'over' : b.cls === 'due-soon' ? 'soon' : ''}>{b.text}</b></div>
            <div className="m-item"><label>预计耗时</label><b>{fmtEst(t.est)}</b></div>
            <div className="m-item"><label>起始日期</label><b>{fmtD(t.start)}</b></div>
            <div className="m-item"><label>优先级</label><b>{p.name}先</b></div>
          </div>
        </div>

        <div className="d-sec">
          <h4>进度</h4>
          {t.steps.length > 0 ? (
            <div className="prog-line">
              <span className="mini-bar" style={{ flex: 1, width: 'auto' }} aria-hidden="true"><i className={pr >= 100 ? 'full' : ''} style={{ width: pr + '%' }}></i></span>
              <em>{doneSteps}/{t.steps.length} 步 · {pr}%</em>
            </div>
          ) : (
            <div className="prog-edit">
              <input type="number" min="0" max="100" step="5" value={t.progress || 0} aria-label="手动设置进度（百分比）" onChange={(e) => onProg(t.id, +e.target.value || 0)} />
              <em>%</em>
              <span style={{ fontSize: '11.5px', color: 'var(--ink-3)' }}>无步骤时手动填写</span>
            </div>
          )}
        </div>

        <div className="d-sec">
          <h4>办理步骤（怎么做）</h4>
          {t.steps.length > 0 ? (
            <div>
              {t.steps.map((s, i) => (
                <div key={i} className="step-wrap">
                  <div className="step">
                    <input type="checkbox" id={'st' + i} checked={s.done} onChange={() => onToggleStep(t.id, i)} />
                    <label htmlFor={'st' + i} style={{ fontWeight: 400 }}><span>{s.t}</span></label>
                    <button
                      type="button"
                      className="iconbtn f-btn"
                      aria-label={'步骤文件：' + s.t}
                      aria-expanded={openStep === i}
                      title="这一步的文件"
                      onClick={() => setOpenStep(openStep === i ? null : i)}
                    >
                      <Icon name="clip" />
                      {!!(s.files || []).length && <span className="f-count">{s.files.length}</span>}
                    </button>
                    <button type="button" className="iconbtn" aria-label={'删除步骤：' + s.t} onClick={() => onDelStep(t.id, i)}><Icon name="x" /></button>
                  </div>
                  {openStep === i && (
                    <div className="step-files">
                      {(s.files || []).length > 0 ? (
                        <div className="filelist">
                          {s.files.map((f, j) => (
                            <FileRow key={j} f={f} onOpenFile={onOpenFile} onCopyPath={onCopyPath}
                              onDel={() => onDelFile(t.id, j, i)} delLabel="移除步骤文件：" />
                          ))}
                        </div>
                      ) : (
                        <p className="notes-p none" style={{ fontSize: '12.5px' }}>这一步还没登记文件。</p>
                      )}
                      <StepFileAdd onAdd={(v) => onAddFile(t.id, v, i)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="notes-p none" style={{ fontSize: '13px' }}>还未拆解，一事几步，拆了才好办。</p>
          )}
          <form className="addline" onSubmit={(e) => { e.preventDefault(); const v = stepText.trim(); if (v) { onAddStep(t.id, v); setStepText(''); } }}>
            <input type="text" maxLength={50} placeholder="补一步，如：报分管领导审签" aria-label="新增步骤" value={stepText} onChange={(e) => setStepText(e.target.value)} />
            <button type="submit" className="btn-ghost">添加</button>
          </form>
        </div>

        <div className="d-sec">
          <h4>文件（存于本机，不上传）</h4>
          {(t.files || []).length > 0 ? (
            <div className="filelist">
              {t.files.map((f, i) => (
                <FileRow key={i} f={f} onOpenFile={onOpenFile} onCopyPath={onCopyPath}
                  onDel={() => onDelFile(t.id, i)} delLabel="移除文件：" />
              ))}
            </div>
          ) : (
            <p className="notes-p none" style={{ fontSize: '13px' }}>还没登记文件。粘贴本机路径即可挂到这件事上。</p>
          )}
          <form className="addline" onSubmit={(e) => { e.preventDefault(); const v = fileText.trim(); if (v) { onAddFile(t.id, v); setFileText(''); } }}>
            <input type="text" maxLength={300} placeholder="粘贴本机文件完整路径，回车登记（不上传）" aria-label="登记本机文件路径" value={fileText} onChange={(e) => setFileText(e.target.value)} />
            <button type="submit" className="btn-ghost">登记</button>
          </form>
        </div>

        <div className="d-sec">
          <h4>备注</h4>
          <p className={'notes-p' + (t.notes ? '' : ' none')}>{t.notes ? t.notes : '暂无备注'}</p>
        </div>

        <div className="d-sec">
          <h4>办理记录</h4>
          <div className="log">
            {[...t.log].reverse().map((l, i) => {
              const d = new Date(l.ts);
              return (
                <div className="log-i" key={i}>
                  <time>{(d.getMonth() + 1)}/{d.getDate()} {pad(d.getHours())}:{pad(d.getMinutes())}</time>
                  <span>{l.text}</span>
                </div>
              );
            })}
          </div>
          <form className="addline" onSubmit={(e) => { e.preventDefault(); const v = noteText.trim(); if (v) { onNote(t.id, v); setNoteText(''); } }}>
            <input type="text" maxLength={60} placeholder="记一笔进展…" aria-label="追加办理记录" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
            <button type="submit" className="btn-ghost">记一笔</button>
          </form>
        </div>

        <div className="d-sec dw-actions">
          <button type="button" className="btn-ghost" onClick={() => onEdit(t.id)}><Icon name="penS" />编辑</button>
          <button type="button" className="btn-ghost danger" onClick={() => onDel(t.id)}><Icon name="trash" />删除</button>
        </div>

        {t.status === 'done' && <span className={'seal big' + (stamp ? ' stamp' : '')} aria-hidden="true">结</span>}
      </div>
    </aside>
  );
}
