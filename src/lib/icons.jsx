/* 线性图标集 · 路径与原单文件版一致 */
const P = {
  list: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><circle class="dot" cx="4.2" cy="6" r=".9"/><circle class="dot" cx="4.2" cy="12" r=".9"/><circle class="dot" cx="4.2" cy="18" r=".9"/>',
  flag: '<path d="M6 21V4.5M6 4.8c2-1.1 4-1.1 6 .1s4 1.2 6 .1v8.6c-2 1.1-4 1.1-6-.1s-4-1.2-6-.1"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.8h17M8 3.2V7M16 3.2V7"/>',
  pen: '<path d="m4 20 1.1-3.9L16.3 4.9a2.2 2.2 0 0 1 3.1 3.1L8.2 19.2 4 20Z"/><path d="m14.5 6.7 2.9 2.9"/>',
  hour: '<path d="M7 3.5h10M7 20.5h10M8.2 3.5v3.2c0 2.6 3.8 3.4 3.8 5.3s-3.8 2.7-3.8 5.3v3.2M15.8 3.5v3.2c0 2.6-3.8 3.4-3.8 5.3s3.8 2.7 3.8 5.3v3.2"/>',
  bell: '<path d="M12 4.2a5.8 5.8 0 0 0-5.8 5.8v3.4L4.6 16h14.8l-1.6-2.6V10A5.8 5.8 0 0 0 12 4.2Z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  today: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"/>',
  board: '<rect x="3.5" y="4.5" width="7" height="15" rx="1.5"/><rect x="13.5" y="4.5" width="7" height="9.5" rx="1.5"/>',
  tl: '<path d="M4.5 4.5v15M8 8h8.5M8 12h11M8 16h5.5"/>',
  gear: '<circle cx="12" cy="12" r="2.8"/><path d="M12 3.8v2.4M12 17.8v2.4M3.8 12h2.4M17.8 12h2.4M6.2 6.2l1.7 1.7M16.1 16.1l1.7 1.7M17.8 6.2l-1.7 1.7M7.9 16.1l-1.7 1.7"/>',
  penS: '<path d="m4 20 1.1-3.9L16.3 4.9a2.2 2.2 0 0 1 3.1 3.1L8.2 19.2 4 20Z"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.8h5V7M6.5 7l.9 12.7h9.2L17.5 7M10 10.8v5.4M14 10.8v5.4"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="6.2"/><path d="M15.6 15.6 20.5 20.5"/>',
  plus: '<path d="M12 5.5v13M5.5 12h13"/>',
  download: '<path d="M12 4.5V15M7.5 10.8 12 15.3l4.5-4.5M4.5 19.5h15"/>',
  upload: '<path d="M12 15V4.5M7.5 8.7 12 4.2l4.5 4.5M4.5 19.5h15"/>',
  lamp: '<path d="M6.5 20.5h11M12 16.8v3.7M7.8 16.8h8.4a.9.9 0 0 0 .9-1c-.3-2.3-2.3-3-3.3-4.2-.7-.8-1-1.6-1-2.6a2.8 2.8 0 1 0-5.6 0c0 1-.3 1.8-1 2.6-1 1.2-3 1.9-3.3 4.2a.9.9 0 0 0 .9 1Z"/>',
  chevL: '<path d="M14.5 6 8.5 12l6 6"/>',
  chevR: '<path d="m9.5 6 6 6-6 6"/>',
  logout: '<path d="M10 4.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H10M9.5 12h10M16 8.5l3.5 3.5-3.5 3.5"/>',
  clip: '<path d="m20 11.7-7.6 7.6a4.3 4.3 0 0 1-6.1-6.1l7.7-7.7a2.9 2.9 0 0 1 4.1 4.1l-7.6 7.6a1.5 1.5 0 0 1-2.1-2.1l6.9-6.9"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
};

export default function Icon({ name, ...rest }) {
  return (
    <svg
      className="ic"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: P[name] || '' }}
      {...rest}
    />
  );
}
