// 공개 덱 둘러보기: 다른 사람이 공개로 저장한 덱을 찾아보고, 미리 보고, 불러온다
import { useState, useEffect } from '../vendor.js';
import { ASPECTS, FACTION_LABEL, TYPE_LABEL, TYPE_ORDER, cardName } from '../cards.js';
import { call } from '../online.js';
import { Modal } from './Modal.jsx';

const PAGE = 30;

const shortDate = (s) => String(s || '').slice(0, 10);

function AspectChips({ deck }) {
  return [deck.aspect, deck.secondAspect].filter(Boolean).map((a) => (
    <span key={a} className={'ctfac f-' + a}>
      {FACTION_LABEL[a] || a}
    </span>
  ));
}

/** 덱 하나 펼쳐 보기: 서버에서 전체 구성을 받아 유형별로 보여준다 */
function DeckPreview({ code, cardsById, onLoad, popup }) {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    call('get', { code })
      .then((j) => alive && setState({ status: 'ok', deck: j.deck }))
      .catch((e) => alive && setState({ status: 'error', error: e.message }));
    return () => {
      alive = false;
    };
  }, [code]);

  if (state.status === 'loading') return <div className="pdpreview muted">불러오는 중…</div>;
  if (state.status === 'error') return <div className="pdpreview muted">{state.error}</div>;

  const deck = state.deck;
  const list = Object.entries(deck.counts || {})
    .filter(([id, n]) => n > 0 && cardsById[id])
    .map(([id, n]) => ({ card: cardsById[id], n }));
  const groups = TYPE_ORDER.map((type) => ({ type, items: list.filter((x) => x.card.type === type) })).filter((g) => g.items.length);

  return (
    <div className="pdpreview">
      {deck.memo ? <p className="pdmemo">{deck.memo}</p> : null}
      <div className="pdcards">
        {groups.map(({ type, items }) => (
          <div key={type} className="pdgroup">
            <h4>
              {TYPE_LABEL[type]} <span>{items.reduce((s, x) => s + x.n, 0)}장</span>
            </h4>
            {items.map(({ card, n }) => (
              <div key={card.id} className="pdcard" tabIndex={0} {...popup.bind(card)}>
                <em>{n}x</em> {cardName(card)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="pdactions">
        <button type="button" className="primary" onClick={() => onLoad(code)}>
          이 덱 불러오기
        </button>
        <span>불러오면 지금 화면의 덱을 바꿉니다. 저장하면 내 복사본이 새 코드로 만들어집니다.</span>
      </div>
    </div>
  );
}

export function PublicDecks({ cards, heroes, currentHero, onLoad, onClose, popup }) {
  const [query, setQuery] = useState('');
  const [hero, setHero] = useState('');
  const [aspect, setAspect] = useState('');
  const [result, setResult] = useState({ status: 'loading', decks: [], total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [openCode, setOpenCode] = useState(null);

  const cardsById = Object.fromEntries(cards.map((c) => [c.id, c]));
  const heroName = (d) => (cardsById[d.hero] ? cardName(cardsById[d.hero]) : d.heroName || d.hero);
  const params = { q: query.trim(), hero, aspect, limit: PAGE };

  useEffect(() => {
    let alive = true;
    setResult((r) => ({ ...r, status: 'loading' }));
    setOpenCode(null);
    popup.hide();
    const timer = setTimeout(
      () => {
        call('list', { ...params, offset: 0 })
          .then((j) => alive && setResult({ status: 'ok', decks: j.decks || [], total: j.total || 0 }))
          .catch((e) => alive && setResult({ status: 'error', error: e.message, decks: [], total: 0 }));
      },
      query ? 300 : 0,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, hero, aspect]);

  const loadMore = () => {
    setLoadingMore(true);
    call('list', { ...params, offset: result.decks.length })
      .then((j) => setResult((r) => ({ ...r, decks: [...r.decks, ...(j.decks || [])], total: j.total || r.total })))
      .catch((e) => setResult((r) => ({ ...r, error: e.message })))
      .finally(() => setLoadingMore(false));
  };

  const filters = (
    <div className="pdfilters">
      <input
        className="hmsearch"
        autoFocus
        placeholder="덱 이름 검색"
        value={query}
        onChange={(ev) => setQuery(ev.target.value)}
        aria-label="덱 이름 검색"
      />
      <select className="sortsel" value={hero} onChange={(ev) => setHero(ev.target.value)} aria-label="히어로">
        <option value="">모든 히어로</option>
        {currentHero ? <option value={currentHero.id}>지금 히어로: {cardName(currentHero)}</option> : null}
        {heroes.map((h) => (
          <option key={h.id} value={h.id}>
            {cardName(h)}
          </option>
        ))}
      </select>
      <select className="sortsel" value={aspect} onChange={(ev) => setAspect(ev.target.value)} aria-label="성향">
        <option value="">모든 성향</option>
        {ASPECTS.map((a) => (
          <option key={a} value={a}>
            {FACTION_LABEL[a]}
          </option>
        ))}
      </select>
    </div>
  );

  let body;
  if (result.status === 'error') {
    body = <p className="pdempty">{result.error}</p>;
  } else if (result.status === 'loading' && !result.decks.length) {
    body = <p className="pdempty">공개 덱을 불러오는 중…</p>;
  } else if (!result.decks.length) {
    body = <p className="pdempty">조건에 맞는 공개 덱이 없습니다.</p>;
  } else {
    body = (
      <ul className={'pdlist' + (result.status === 'loading' ? ' stale' : '')}>
        {result.decks.map((d) => {
          const open = openCode === d.code;
          return (
            <li key={d.code} className={open ? 'open' : ''}>
              <button type="button" className="pdrow" aria-expanded={open} onClick={() => setOpenCode(open ? null : d.code)}>
                <span className="pdname">{d.name}</span>
                <span className="pdhero">{heroName(d)}</span>
                <span className="pdaspects">
                  <AspectChips deck={d} />
                </span>
                <span className="pdcount">{d.cardCount}장</span>
                <span className="pddate">{shortDate(d.updatedAt)}</span>
                <code>{d.code}</code>
              </button>
              {open ? <DeckPreview code={d.code} cardsById={cardsById} onLoad={onLoad} popup={popup} /> : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Modal
      title="공개 덱"
      className="pdbox"
      onClose={onClose}
      head={filters}
      foot={
        result.status === 'ok' || result.decks.length
          ? `공개 덱 ${result.total.toLocaleString()}개 · 최근 수정순 · 덱을 누르면 구성을 미리 봅니다.`
          : '다른 사람이 "공개 목록에 올리기"로 저장한 덱입니다.'
      }
    >
      <div className="pdbody">
        {body}
        {result.decks.length && result.decks.length < result.total ? (
          <button type="button" className="secondary loadmore" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? '불러오는 중…' : `더 보기 · ${result.decks.length} / ${result.total}`}
          </button>
        ) : null}
      </div>
    </Modal>
  );
}
