// 마우스를 올리면 뜨는 카드 팝업
import { useState } from '../vendor.js';
import { FACTION_LABEL, TYPE_LABEL, cardName, costLabel, cardImage } from '../cards.js';
import { resourceIcons } from './common.jsx';

const POPUP_WIDTH = 340;
const POPUP_MAX_HEIGHT = 320;

/**
 * 팝업 상태 훅. bind(card) 를 버튼에 펼쳐 넣으면 마우스를 올렸을 때 팝업이 뜬다.
 *   const popup = useCardPopup();
 *   <button {...popup.bind(card)}>…</button>
 *   <CardPopup state={popup.state} />
 */
export function useCardPopup() {
  const [state, setState] = useState(null);
  const bind = (card) => ({
    onMouseEnter: (ev) => {
      const h = Math.min(POPUP_MAX_HEIGHT, window.innerHeight - 16);
      let left = ev.clientX + 16;
      let top = ev.clientY + 14;
      if (left + POPUP_WIDTH > window.innerWidth - 8) left = Math.max(8, ev.clientX - POPUP_WIDTH - 16);
      if (top + h > window.innerHeight - 8) top = Math.max(8, window.innerHeight - h - 8);
      setState({ card, left, top });
    },
    onMouseLeave: () => setState(null),
  });
  return { state, bind, hide: () => setState(null) };
}

/** 카드 이미지. 주소가 없거나 못 불러오면 아무것도 그리지 않는다. */
const failedImages = new Set();
export function CardImage({ card, className }) {
  const src = cardImage(card);
  const [, redraw] = useState(0);
  if (!src || failedImages.has(src)) return null;
  return (
    <img
      className={className || 'cardimg'}
      src={src}
      alt={cardName(card)}
      loading="lazy"
      onError={() => {
        failedImages.add(src);
        redraw((n) => n + 1);
      }}
    />
  );
}

export function CardPopup({ state }) {
  if (!state) return null;
  const c = state.card;
  return (
    <div className="cardpop" style={{ top: state.top + 'px', left: state.left + 'px' }}>
      <div className="cphead">
        <b>
          {c.unique ? '◆ ' : ''}
          {cardName(c)}
        </b>
        <span>{c.name}</span>
      </div>
      <div className="cpmeta">
        <span className={'ctfac f-' + c.faction}>{FACTION_LABEL[c.faction]}</span>
        <span>{TYPE_LABEL[c.type]}</span>
        <span>비용 {costLabel(c)}</span>
        {resourceIcons(c)}
      </div>
      <div className="cptraits">{c.traitsKo || c.traits || '특성 없음'}</div>
      <p>{c.textKo || c.text || '효과 텍스트 없음'}</p>
      {c.textKo && c.text ? <p className="cpen">{c.text}</p> : null}
    </div>
  );
}
