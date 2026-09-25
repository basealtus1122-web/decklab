// 히어로 선택 창
import { useState } from '../vendor.js';
import { aspectCount, cardName } from '../cards.js';

export function HeroPicker({ heroes, currentId, onPick, onClose }) {
  const [query, setQuery] = useState('');
  const q = query.toLowerCase();
  const shown = heroes.filter((hero) => {
    const text = [cardName(hero), hero.name, hero.subKo || '', hero.subname || '', hero.traitsKo || ''].join(' ').toLowerCase();
    return !q || text.includes(q);
  });

  return (
    <div
      className="heromodal"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className="hmbox">
        <div className="hmhead">
          <h2>히어로 선택</h2>
          <input
            className="hmsearch"
            autoFocus
            placeholder="히어로 이름 검색"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
          />
          <button type="button" className="hmclose" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="hmgrid">
          {shown.map((hero) => {
            const aspects = aspectCount(hero);
            return (
              <button
                key={hero.id}
                type="button"
                className={'hmcard' + (hero.id === currentId ? ' on' : '')}
                onClick={() => onPick(hero.id)}
              >
                <b>{cardName(hero)}</b>
                <span className="hmsub">{hero.subKo || hero.subname || hero.name}</span>
                <span className="hmtr">{hero.traitsKo || hero.traits || ''}</span>
                <span className="hmpack">
                  {hero.pack}
                  {aspects > 1 ? <em>성향 {aspects}</em> : null}
                </span>
              </button>
            );
          })}
        </div>
        <p className="hmfoot">히어로 {heroes.length}명 · 고르면 전용 카드가 덱에 자동으로 들어갑니다.</p>
      </div>
    </div>
  );
}
