/* 任务数据模型 · 与原单文件版一致 */
import { CATS, PRIO, STATUS } from './constants.js';
import { offsetISO, parseD, daysLeft } from './date.js';

let uid = 0;
export const newId = () => 't' + Date.now().toString(36) + (uid++).toString(36);

export function normalize(t) {
  t.id = t.id || newId();
  t.cat = CATS[t.cat] ? t.cat : 'daily';
  t.priority = PRIO[t.priority] ? t.priority : 2;
  t.status = STATUS[t.status] ? t.status : 'todo';
  t.steps = Array.isArray(t.steps) ? t.steps.filter((s) => s && s.t) : [];
  t.log = Array.isArray(t.log) ? t.log : [];
  t.notes = t.notes || ''; t.est = +t.est > 0 ? +t.est : 1;
  t.start = t.start || t.due; t.doneAt = t.doneAt || null;
  return t;
}

export const prog = (t) => t.steps.length
  ? Math.round(t.steps.filter((s) => s.done).length / t.steps.length * 100)
  : (t.status === 'done' ? 100 : (t.progress || 0));

export const isOver = (t) => t.status !== 'done' && daysLeft(t.due) < 0;

export function log(t, text) { t.log.push({ ts: Date.now(), text }); }

export function seedData() {
  const T = (title, cat, priority, dueO, startO, est, status, steps, notes) => {
    const t = normalize({
      id: newId(), title, cat, priority, due: offsetISO(dueO), start: offsetISO(startO), est, status,
      steps: steps.map(([x, d]) => ({ t: x, done: !!d })), notes: notes || '',
    });
    t.log = [{ ts: parseD(t.start).getTime(), text: '建账立卡' }];
    if (status === 'done') { t.doneAt = parseD(t.due).getTime(); t.log.push({ ts: parseD(t.due).getTime(), text: '办结归档' }); }
    return t;
  };
  return [
    T('三季度党建工作总结', 'party', 1, 6, -9, 3, 'doing',
      [['梳理三季度党建台账', true], ['汇总三会一课记录', true], ['起草总结初稿', false], ['报书记审改', false], ['定稿上报机关党委', false]],
      '模板见共享盘 /党建/2026/季度总结'),
    T('9月主题党日活动组织', 'party', 2, 3, -4, 2, 'doing',
      [['确定主题与流程', true], ['通知党员参会', true], ['准备学习材料', false], ['会场布置与签到', false], ['会议记录与影像归档', false]]),
    T('党员发展对象培养考察记录', 'party', 2, 12, -2, 1.5, 'todo',
      [['整理培养联系人意见', false], ['填写考察写实表', false], ['支部委员会审阅', false]]),
    T('组织生活会整改台账更新', 'party', 3, 9, -3, 1, 'todo',
      [['对照整改清单逐项核销', false], ['补充佐证材料', false]]),
    T('党纪学习自学笔记补记', 'party', 3, 0, -8, 0.5, 'doing',
      [['整理本月学习篇目', true], ['补写学习体会两则', false]]),
    T('8月党费收缴明细核对', 'party', 2, -8, -12, 0.5, 'done',
      [['导出党费缴纳记录', true], ['与财务对账', true], ['公示并存档', true]]),
    T('国庆职工文体活动策划案', 'event', 1, 5, -6, 4, 'doing',
      [['拟定活动方案与预算', true], ['报领导审批', false], ['发布报名通知', false], ['落实场地物资', false], ['活动执行与小结', false]],
      '预算表需财务会签'),
    T('重阳节走访慰问安排', 'event', 2, 20, 2, 2, 'todo',
      [['统计慰问名单', false], ['采购慰问品', false], ['协调车辆与人员分组', false]]),
    T('9月信息报送（两篇）', 'report', 1, 1, -1, 0.5, 'doing',
      [['选题与收集素材', true], ['撰写初稿', false], ['核校报送', false]],
      '报送口：办公室信息科'),
    T('年度述职报告初稿', 'report', 3, 35, 12, 5, 'todo',
      [['盘点全年工作台账', false], ['提炼亮点与数据', false], ['撰写初稿', false]]),
    T('办公用品采购与报销', 'daily', 1, -1, -5, 0.5, 'doing',
      [['汇总各科室需求', true], ['提交采购申请', true], ['验收入库', false], ['贴票报销', false]],
      '发票交李会计处'),
    T('周例会会议室预约', 'daily', 3, 2, 0, 0.25, 'done',
      [['确认参会人员', true], ['预约会议室并发通知', true]]),
  ];
}
