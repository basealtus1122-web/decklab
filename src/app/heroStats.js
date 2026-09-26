// 히어로 수치: src/data/hero-stats.csv 를 읽는다.
// 엑셀·구글 시트에서 채운 뒤 "CSV UTF-8" 로 저장해 같은 이름으로 바꿔 넣고 npm run build 하면 바로 반영된다.
// 칸이 비어 있으면 그 수치는 화면에 나오지 않는다. 한 줄이 한 히어로 면(카드 ID)이다.
import csvText from '../data/hero-stats.csv';

// CSV 머리글 → 내부 이름. 머리글 순서는 바뀌어도 되고, 모르는 머리글(참고용 칸 등)은 무시한다.
const COLUMNS = {
  id: 'id',
  체력: 'hp',
  저지: 'thw',
  공격: 'atk',
  방어: 'def',
  히어로손패: 'hand',
  일상이름: 'alterName',
  회복: 'rec',
  일상손패: 'alterHand',
};

/** 따옴표·쉼표·줄바꿈을 지원하는 작은 CSV 읽개 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function load(text) {
  const [head, ...rows] = parseCsv(text);
  if (!head) return {};
  const keys = head.map((h) => COLUMNS[h.replace(/\s/g, '')] || null);
  const out = {};
  for (const r of rows) {
    const o = {};
    keys.forEach((k, i) => {
      const v = (r[i] || '').trim();
      if (k && v) o[k] = v;
    });
    if (o.id && Object.keys(o).length > 1) out[o.id] = o;
  }
  return out;
}

const STATS = load(csvText);

/** 히어로 면 하나의 수치. 없으면 null */
export const heroStats = (hero) => (hero && STATS[hero.id]) || null;

/** 화면에 늘어놓을 [이름, 값] 목록. 값이 없는 것은 뺀다 */
export const heroSideStats = (s) =>
  s
    ? [
        ['체력', s.hp],
        ['저지', s.thw],
        ['공격', s.atk],
        ['방어', s.def],
        ['손패', s.hand],
      ].filter(([, v]) => v)
    : [];

export const alterSideStats = (s) =>
  s
    ? [
        ['회복', s.rec],
        ['손패', s.alterHand],
      ].filter(([, v]) => v)
    : [];
