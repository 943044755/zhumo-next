import Icon from '../lib/icons.jsx';

export default function Empty({ icon, kai, text, withNew, onNew }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <p className="kai">{kai}</p>
      <p>{text}</p>
      {withNew && <button type="button" className="btn-primary" onClick={onNew}>记一件事</button>}
    </div>
  );
}
