/* 日期工具 · 与原单文件版一致 */
export const DAY = 864e5;
export const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parseD = (s) => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c); };

export function offsetISO(n) {
  const d = new Date(); d.setHours(12, 0, 0, 0);
  return iso(new Date(d.getTime() + n * DAY));
}

export const TODAY = offsetISO(0);

export const daysLeft = (s) => Math.round((parseD(s) - parseD(TODAY)) / DAY);
export const fmtD = (s) => { const d = parseD(s); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; };
export const weekCN = (s) => '周' + '日一二三四五六'[parseD(s).getDay()];

export function dueBadge(t) {
  if (t.status === 'done') return { text: fmtD(t.due) + ' 办结', cls: 'due-ok' };
  const dl = daysLeft(t.due);
  if (dl < 0) return { text: '逾期' + (-dl) + '天', cls: 'due-over' };
  if (dl === 0) return { text: '今日到期', cls: 'due-over' };
  if (dl <= 3) return { text: '剩' + dl + '天', cls: 'due-soon' };
  return { text: fmtD(t.due) + ' ' + weekCN(t.due), cls: 'due-ok' };
}

export const fmtEst = (e) => !e ? '—' : (e === 0.5 ? '半天' : ('约' + (+e.toFixed(2)) + '天'));

export function ganzhi(y) {
  return '甲乙丙丁戊己庚辛壬癸'[(y - 4) % 10] + '子丑寅卯辰巳午未申酉戌亥'[(y - 4) % 12] + '年';
}
