import { useEffect, useRef, useState } from 'react';
import Icon from '../lib/icons.jsx';
import { CATS, PRIO } from '../lib/constants.js';
import { TODAY } from '../lib/date.js';

const PRIO_HINT = [' · 紧要', ' · 常规', ' · 从容'];

/* 记一件事 / 修改事项 弹窗。关闭时保留最后内容，保证淡出动画期间不闪空（与原版一致）。 */
export default function TaskModal({ open, task, onSave, onClose, dlgRef }) {
  const lastRef = useRef(null);
  const shown = task || lastRef.current;
  useEffect(() => { if (task) lastRef.current = task; }, [task]);

  const rootRef = useRef(null);
  const titleRef = useRef(null);
  const dueRef = useRef(null);

  const blank = { title: '', due: TODAY, start: TODAY, est: 1, notes: '', stepsText: '' };
  const [form, setForm] = useState(blank);
  const [cat, setCat] = useState('party');
  const [prio, setPrio] = useState(2);
  const [errs, setErrs] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(task
      ? {
          title: task.title,
          due: task.due,
          start: task.start || TODAY,
          est: task.est || 1,
          notes: task.notes || '',
          stepsText: task.steps.map((s) => s.t).join('\n'),
        }
      : blank);
    setCat(task ? task.cat : 'party');
    setPrio(task ? task.priority : 2);
    setErrs({});
    titleRef.current && titleRef.current.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task && task.id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const title = form.title.trim();
    const due = form.due;
    const next = {};
    if (!title) next.title = true;
    if (!due) next.due = true;
    setErrs(next);
    if (next.title || next.due) {
      (title ? dueRef : titleRef).current && (title ? dueRef : titleRef).current.focus();
      return;
    }
    const steps = form.stepsText.split('\n').map((s) => s.trim()).filter(Boolean).map((x) => ({ t: x, done: false }));
    onSave({
      title, cat, priority: prio, due,
      start: form.start || TODAY,
      est: Math.max(0.25, +form.est || 1),
      notes: form.notes.trim(),
      steps,
    });
  };

  return (
    <div
      className={'modal' + (open ? ' show' : '')} role="dialog" aria-modal="true" aria-labelledby="mTitle" ref={rootRef}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dlg" ref={dlgRef}>
        <button type="button" className="iconbtn close-x" aria-label="关闭" onClick={onClose}><Icon name="x" /></button>
        <p className="dlg-kicker">{shown ? '白纸黑字 · 改之有据' : '今日事 · 今日毕'}</p>
        <h3 id="mTitle">{shown ? '修改事项' : '记一件事'}</h3>
        <form className="frm" noValidate onSubmit={submit}>
          <div className={'f-row' + (errs.title ? ' bad' : '')}>
            <label className="req" htmlFor="fTitle">事项</label>
            <input id="fTitle" ref={titleRef} type="text" maxLength={60} placeholder="例：三季度党建工作总结" value={form.title} onChange={set('title')} />
            <span className="f-err">请填写事项名称</span>
          </div>
          <div className="f-2col">
            <div className="f-row">
              <label id="lbCat">分类</label>
              <div className="seg" role="radiogroup" aria-labelledby="lbCat">
                {Object.entries(CATS).map(([k, c]) => (
                  <label className="segopt" key={k}>
                    <input type="radio" name="fcat" value={k} checked={cat === k} onChange={() => setCat(k)} />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="f-row">
              <label id="lbPrio">优先级</label>
              <div className="seg" role="radiogroup" aria-labelledby="lbPrio">
                {[1, 2, 3].map((pv, i) => (
                  <label className="segopt" key={pv}>
                    <input type="radio" name="fprio" value={pv} checked={prio === pv} onChange={() => setPrio(pv)} />
                    <span>{PRIO[pv].name + PRIO_HINT[i]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="f-2col">
            <div className={'f-row' + (errs.due ? ' bad' : '')}>
              <label className="req" htmlFor="fDue">截止日期</label>
              <input id="fDue" ref={dueRef} type="date" value={form.due} onChange={set('due')} />
              <span className="f-err">请选择截止日期</span>
            </div>
            <div className="f-row">
              <label htmlFor="fStart">起始日期</label>
              <input id="fStart" type="date" value={form.start} onChange={set('start')} />
              <span className="f-hint">默认今天，用于时间轴</span>
            </div>
          </div>
          <div className="f-2col">
            <div className="f-row">
              <label htmlFor="fEst">预计耗时（天）</label>
              <input id="fEst" type="number" min="0.25" max="90" step="0.25" value={form.est} onChange={set('est')} />
            </div>
            <div className="f-row">
              <label htmlFor="fNotes">备注</label>
              <input id="fNotes" type="text" maxLength={80} placeholder="材料位置、报审对象等" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div className="f-row">
            <label htmlFor="fSteps">办理步骤</label>
            <textarea id="fSteps" rows="4" placeholder="一行一步，把「怎么做」拆开" value={form.stepsText} onChange={set('stepsText')}></textarea>
            <span className="f-hint">每行一步；勾选步骤会自动推进度</span>
          </div>
          <div className="frm-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">{shown ? '保存修改' : '记入案头'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
