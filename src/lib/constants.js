/* 常量 · 与原单文件版一致 */
export const LS_KEY = 'zhumo.desk.v1';

export const CATS = {
  party:  { name: '党建',     cls: 'c-party'  },
  event:  { name: '活动策划', cls: 'c-event'  },
  report: { name: '工作报告', cls: 'c-report' },
  daily:  { name: '日常事务', cls: 'c-daily'  },
};

export const PRIO = {
  1: { name: '急', cls: 'p-high' },
  2: { name: '中', cls: 'p-mid'  },
  3: { name: '缓', cls: 'p-low'  },
};

export const STATUS = { todo: '未开始', doing: '进行中', done: '已办结' };

export const CAT_ICON = { all: 'list', party: 'flag', event: 'cal', report: 'pen', daily: 'hour' };

export const TAB_META = {
  today: ['today', '今日'],
  board: ['board', '看板'],
  list:  ['list',  '清单'],
  tl:    ['tl',    '时间轴'],
};

export const COLS = [
  ['todo',  '未开始', 'var(--ink-3)'],
  ['doing', '进行中', 'var(--indigo)'],
  ['done',  '已办结', 'var(--bamboo)'],
];
