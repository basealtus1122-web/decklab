// 마우스를 올리면 뜨는 카드 팝업 (카드 목록, 덱 목록, 히어로 선택 창, 통계 공통)
import { useState, useEffect, useLayoutEffect, useRef } from '../vendor.js';
import { FACTION_LABEL, TYPE_LABEL, aspectCount, alterEgoId, cardImage, cardName, costLabel } from '../cards.js';
import { resourceIcons, StatChips } from './common.jsx';
import { RichText } from './RichText.jsx';
import { alterSideStats, heroSideStats, heroStats } from '../heroStats.js';

let popupSeq = 0;

const GAP = 14; // 마우스 포인터와 팝업 사이
const MARGIN = 8; // 화면 가장자리 여백

/**
 * 팝업 상태 훅. bind(card) 를 요소에 펼쳐 넣으면 마우스를 올리거나 키보드로 초점이 가면 팝업이 뜬다.
 *   const popup = useCardPopup();
 *   <button {...popup.bind(card)}>…</button>
 *   <CardPopup popup={popup} faces={hero => 다른 면 목록} />
 * 히어로는 bind(hero, 'hero') 로 넘기면 히어로·일상 능력 팝업이 뜬다.
 */
export function useCardPopup() {
  const [state, setState] = useState(null);
  const hide = () => setState(null);

  // 클릭이나 키 입력이 오면 닫는다 (목록이 바뀌어 요소가 사라져도 팝업이 남지 않게).
  // 스크롤로는 닫지 않는다: 포인터 아래 요소가 바뀌면 브라우저가 알아서 leave/enter 를 보낸다.
  // 마우스를 올리자마자 누르는 경우도 있으므로 처음부터 걸어 둔다 (이미 닫혀 있으면 아무 일도 없다).
  useEffect(() => {
    window.addEventListener('pointerdown', hide, true);
    window.addEventListener('keydown', hide, true);
    return () => {
      window.removeEventListener('pointerdown', hide, true);
      window.removeEventListener('keydown', hide, true);
    };
  }, []);

  /** anchor: 'pointer' 는 마우스 옆, 'element' 는 요소 옆(격자처럼 요소가 작을 때) */
  const bind = (card, kind = 'card', anchor = 'pointer') => ({
    onPointerEnter: (ev) => {
      if (ev.pointerType === 'touch') return;
      const rect = anchor === 'element' ? ev.currentTarget.getBoundingClientRect() : null;
      setState({ id: ++popupSeq, card, kind, x: ev.clientX, y: ev.clientY, rect });
    },
    onPointerLeave: hide,
    onFocus: (ev) => {
      if (!ev.currentTarget.matches(':focus-visible')) return;
      const rect = ev.currentTarget.getBoundingClientRect();
      setState({ id: ++popupSeq, card, kind, x: rect.right, y: rect.top, rect });
    },
    onBlur: hide,
  });
  return { state, bind, hide };
}

/** 카드 이미지. 주소가 없거나 못 불러오면 아무것도 그리지 않는다. */
const failedImages = new Set();
export function CardImage({ card, id, className }) {
  const src = cardImage(id ? { id } : card);
  const [, redraw] = useState(0);
  if (!src || failedImages.has(src)) return null;
  return (
    <img
      className={className || 'cardimg'}
      src={src}
      alt={card ? cardName(card) : ''}
      loading="lazy"
      onError={() => {
        failedImages.add(src);
        redraw((n) => n + 1);
      }}
    />
  );
}

function CardBody({ card: c }) {
  return (
    <div className="cpbody">
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
      <p>
        <RichText text={c.textKo || c.text || '효과 텍스트 없음'} />
      </p>
      {c.textKo && c.text ? (
        <p className="cpen">
          <RichText text={c.text} />
        </p>
      ) : null}
    </div>
  );
}

function HeroBody({ hero, faces }) {
  const aspects = aspectCount(hero);
  const alter = hero.alterTextKo || hero.alterText;
  const stats = heroStats(hero);
  const alterStats = alterSideStats(stats);
  return (
    <div className="cpbody">
      <div className="cphead">
        <b>
          {hero.unique ? '◆ ' : ''}
          {cardName(hero)}
        </b>
        <span>{[hero.name, stats?.alterName || hero.subKo || hero.subname].filter(Boolean).join(' · ')}</span>
      </div>
      <div className="cpmeta">
        <span>{hero.traitsKo || hero.traits || '특성 없음'}</span>
        <span>{hero.pack}</span>
        {aspects > 1 ? <em className="cpaspects">성향 {aspects}</em> : null}
      </div>
      <div className="cpside">히어로</div>
      <StatChips items={heroSideStats(stats)} />
      <p>
        <RichText text={hero.textKo || hero.text || '-'} />
      </p>
      {alter || alterStats.length ? (
        <>
          <div className="cpside">일상{stats?.alterName ? ' · ' + stats.alterName : ''}</div>
          <StatChips items={alterStats} />
          {alter ? (
            <p>
              <RichText text={alter} />
            </p>
          ) : null}
        </>
      ) : null}
      {faces.map((face, i) => (
        <div key={face.id} className="cpface">
          <div className="cpside">{cardName(face) !== cardName(hero) ? cardName(face) : '히어로 면 ' + (i + 2)}</div>
          <StatChips items={heroSideStats(heroStats(face))} />
          <p>
            <RichText text={face.textKo || face.text || '-'} />
          </p>
          {face.alterTextKo || face.alterText ? (
            <p>
              <RichText text={face.alterTextKo || face.alterText} />
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * 팝업. faces(hero) 는 히어로의 다른 면 목록을 돌려주는 함수 (히어로 팝업에만 쓴다).
 * 처음엔 보이지 않게 그린 뒤 실제 크기를 재서 화면 안에 들어오게 옮긴다.
 */
export function CardPopup({ popup, faces }) {
  const state = popup.state;
  return state ? <PopupBox key={state.id} state={state} faces={faces} /> : null;
}

function PopupBox({ state, faces }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const { card, kind } = state;

  // 크기를 재서 화면 안에 들어오게 둔다. 이미지가 늦게 로드돼 크기가 바뀌면 다시 잰다
  useLayoutEffect(() => {
    const el = ref.current;
    const place = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const r = state.rect;
      let left;
      let top;
      if (r) {
        // 요소 오른쪽, 자리가 없으면 왼쪽. 위쪽 선을 요소에 맞춘다
        left = r.right + GAP / 2;
        if (left + w > vw - MARGIN) left = r.left - w - GAP / 2;
        if (left < MARGIN) left = Math.min(vw - w - MARGIN, Math.max(MARGIN, r.left));
        top = r.top;
      } else {
        left = state.x + GAP;
        if (left + w > vw - MARGIN) left = Math.max(MARGIN, state.x - w - GAP);
        top = state.y + GAP;
      }
      if (top + h > vh - MARGIN) top = Math.max(MARGIN, vh - h - MARGIN);
      setPos({ left, top });
    };
    place();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null;
    if (ro) ro.observe(el);
    return () => ro && ro.disconnect();
  }, []);

  const isHero = kind === 'hero';
  const images = isHero ? [card.id, alterEgoId(card)] : [card.id];
  const hasImage = images.some((id) => cardImage(id === card.id ? card : { id }));

  return (
    <div
      ref={ref}
      className={'cardpop' + (isHero ? ' heropop' : '') + (hasImage ? ' withimg' : '')}
      role="tooltip"
      style={pos ? { left: pos.left + 'px', top: pos.top + 'px' } : { left: 0, top: 0, visibility: 'hidden' }}
    >
      {hasImage ? (
        <div className="cpimgs">
          {images.map((id) => (id === card.id ? <CardImage key={id} card={card} /> : <CardImage key={id} id={id} />))}
        </div>
      ) : null}
      {isHero ? <HeroBody hero={card} faces={faces ? faces(card) : []} /> : <CardBody card={card} />}
    </div>
  );
}
