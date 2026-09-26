// 여러 곳에서 쓰는 작은 조각들
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../vendor.js';
import { RESOURCES, cardName, copyLimit, canInclude, isSignature } from '../cards.js';
import { ICON_SVG, RESOURCE_ICON } from '../icons.js';

/** 자원 아이콘 하나 */
export function ResourceIcon({ type, title }) {
  return <span className={'res res-' + type} title={title} dangerouslySetInnerHTML={{ __html: ICON_SVG[RESOURCE_ICON[type]] }} />;
}

/** 카드가 만드는 자원 아이콘 줄. 자원이 없으면 null */
export function resourceIcons(card) {
  const r = card && card.resources;
  if (!r) return null;
  const icons = [];
  for (const [type, label] of RESOURCES) {
    for (let i = 0; i < (r[type] || 0); i++) icons.push(<ResourceIcon key={type + i} type={type} title={label} />);
  }
  return icons.length ? <span className="reslist">{icons}</span> : null;
}

/** 드롭다운 선택 (options: [값, 표시] 목록) */
export function Picker({ value, onChange, options, label }) {
  return (
    <Select value={value} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger aria-label={label} className="picker">
        <SelectValue>{options.find((o) => o[0] === value)?.[1] || value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, text]) => (
          <SelectItem key={v} value={v}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** 막대 차트 (items: {l 이름, v 값, c 색, t 툴팁}) */
export function BarChart({ title, items }) {
  const max = Math.max(1, ...items.map((x) => x.v));
  return (
    <div className="chart">
      <div className="charttitle">{title}</div>
      <div className="bars">
        {items.map((x) => (
          <div key={x.l} className="bar" title={x.t || x.l}>
            <b>{x.v}</b>
            <span
              className="barfill"
              style={{ height: (x.v ? Math.max(3, (x.v / max) * 100) : 0) + '%', background: x.c || '#6fa8e0' }}
            />
            <small>{x.l}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 카드 수량 버튼 0‥제한. 히어로 전용 카드는 고정 장수만 보여준다. */
export function QuantityButtons({ card, hero, deck, onSet }) {
  if (isSignature(card, hero)) {
    return <span className="qtyfixed">{deck.counts[card.id] || card.quantity || 0}장</span>;
  }
  const limit = copyLimit(card, hero);
  const current = deck.counts[card.id] || 0;
  const allowed = canInclude(card, hero, deck);
  const buttons = [];
  for (let n = 0; n <= limit; n++) {
    buttons.push(
      <button
        key={n}
        type="button"
        aria-label={cardName(card) + ' ' + n + '장'}
        className={current === n ? 'on' : ''}
        disabled={!allowed && n > 0}
        onClick={() => onSet(card.id, n)}
      >
        {n}
      </button>,
    );
  }
  return <span className="qtybtns">{buttons}</span>;
}

/** 히어로 수치 칩 (체력 10 · 저지 1 …). 목록이 비면 아무것도 그리지 않는다 */
export function StatChips({ items }) {
  if (!items.length) return null;
  return (
    <div className="herostats">
      {items.map(([label, value]) => (
        <span key={label}>
          {label} <b>{value}</b>
        </span>
      ))}
    </div>
  );
}
