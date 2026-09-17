import { useEffect, useRef } from 'react';

/* 确认弹窗。关闭时保留最后内容，保证淡出动画期间不闪空（与原版一致）。 */
export default function ConfirmModal({ confirm, onClose, onOk, rootRef }) {
  const lastRef = useRef(null);
  const shown = confirm || lastRef.current;
  useEffect(() => { if (confirm) lastRef.current = confirm; }, [confirm]);

  const okRef = useRef(null);
  useEffect(() => { if (confirm && okRef.current) okRef.current.focus(); }, [confirm]);

  return (
    <div
      className={'modal' + (confirm ? ' show' : '')} role="alertdialog" aria-modal="true"
      aria-labelledby="cfTitle" aria-describedby="cfText" ref={rootRef}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dlg sm">
        <h3 id="cfTitle">{shown ? shown.title : '确认操作'}</h3>
        <p className="cf-text" id="cfText">{shown ? shown.text : ''}</p>
        <div className="cf-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>再想想</button>
          <button type="button" ref={okRef} className="btn-danger" onClick={onOk}>确认</button>
        </div>
      </div>
    </div>
  );
}
