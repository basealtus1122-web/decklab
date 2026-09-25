// 히어로 선택 창. 히어로에 마우스를 올리면 히어로·일상 능력 팝업이 뜬다.
import { useState } from '../vendor.js';
import { aspectCount, cardName } from '../cards.js';
import { Modal } from './Modal.jsx';

export function HeroPicker({ heroes, currentId, onPick, onClose, popup }) {
  const [query, setQuery] = useState('');
  const q = query.toLowerCase();
  const shown = heroes.filter((hero) => {
    const text = [cardName(hero), hero.name, hero.subKo || '', hero.subname || '', hero.traitsKo || ''].join(' ').toLowerCase();
    return !q || text.includes(q);
  });

  return (
    <Modal
      title="히어로 선택"
      onClose={onClose}
      head={
        <input
          className="hmsearch"
          autoFocus
          placeholder="히어로 이름 검색"
          value={query}
          onChange={(ev) => setQuery(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' && shown.length === 1) onPick(shown[0].id);
          }}
        />
      }
      foot={`히어로 ${heroes.length}명 · 고르면 전용 카드가 덱에 자동으로 들어갑니다. 마우스를 올리면 능력이 보입니다.`}
    >
      <div className="hmgrid">
        {shown.map((hero) => {
          const aspects = aspectCount(hero);
          return (
            <button
              key={hero.id}
              type="button"
              className={'hmcard' + (hero.id === currentId ? ' on' : '')}
              onClick={() => onPick(hero.id)}
              {...popup.bind(hero, 'hero', 'element')}
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
        {shown.length === 0 ? <p className="hmempty">‘{query}’에 맞는 히어로가 없습니다.</p> : null}
      </div>
    </Modal>
  );
}
