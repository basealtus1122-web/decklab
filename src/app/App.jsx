// 덱랩 화면 전체
import { useState, useMemo, useEffect } from './vendor.js';
import { canInclude, isExcludedSet, isSignature, listHeroes, matchesQuery, otherHeroFaces, sortCards, subdeckCards } from './cards.js';
import { deckCards, deckSize, newDeck, parseDeckFile, validateDeck } from './deck.js';
import { loadPrefs, savePrefs } from './online.js';
import { useOnlineDeck } from './useOnlineDeck.js';
import { useCardPopup, CardPopup } from './components/CardPopup.jsx';
import { HeroPicker } from './components/HeroPicker.jsx';
import { Library } from './components/Library.jsx';
import { DeckPanel } from './components/DeckPanel.jsx';
import { CardDetail } from './components/CardDetail.jsx';
import { PublicDecks } from './components/PublicDecks.jsx';
import { Stats } from './components/Stats.jsx';

const PAGE = 24;

const DEFAULT_FILTERS = {
  query: '',
  cost: 'all',
  pack: 'all',
  types: [],
  aspects: [],
  fitsDeck: true,
  sortKey: 'name',
  sortDir: 'asc',
  view: 'list',
};
// 이 브라우저에 기억해 두는 화면 설정
const REMEMBERED = ['sortKey', 'sortDir', 'view'];

export function App({ cards }) {
  const heroes = useMemo(() => listHeroes(cards), [cards]);
  const heroSets = useMemo(() => new Set(heroes.map((h) => h.set)), [heroes]);
  const packs = useMemo(() => Array.from(new Set(cards.map((c) => c.pack))).sort(), [cards]);
  const [prefs, setPrefs] = useState(loadPrefs);

  const [deck, setDeck] = useState(() => newDeck(cards, cards.find((c) => c.type === 'hero' && c.name === 'Groot').id));
  const [filters, setFilters] = useState(() => {
    const f = { ...DEFAULT_FILTERS };
    for (const k of REMEMBERED) if (prefs[k]) f[k] = prefs[k];
    return f;
  });
  const [visible, setVisible] = useState(PAGE);
  const [detailCard, setDetailCard] = useState(null);
  const [notice, setNotice] = useState('');
  // 떠 있는 창: heroes(히어로 선택) | decks(공개 덱) | stats(인기 통계) | null
  const [modal, setModal] = useState('heroes');
  const popup = useCardPopup();

  const hero = heroes.find((h) => h.id === deck.hero);
  const inDeck = deckCards(cards, deck);
  const size = deckSize(cards, deck);
  const issues = validateDeck(cards, hero, deck);

  const online = useOnlineDeck({
    heroes,
    hero,
    deck,
    setDeck,
    inDeck,
    onLoaded: ({ name, message }) => {
      setModal(null);
      setNotice(`‘${name}’ — ${message}`);
    },
  });

  const updatePrefs = (patch) => {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      savePrefs(next);
      return next;
    });
  };

  // 주소에 #deck=코드(&key=편집키)가 있으면 그 덱을 불러온다
  useEffect(() => {
    const hash = location.hash || '';
    const code = /deck=([A-Za-z0-9-]{9})/.exec(hash);
    const key = /key=([a-f0-9]{40})/.exec(hash);
    if (code) {
      setModal(null);
      online.load(code[1], key ? key[1] : '');
    }
  }, []);

  const { query, cost, pack, types, aspects, fitsDeck, sortKey, sortDir } = filters;
  const shown = useMemo(
    () =>
      sortCards(
        cards.filter(
          (c) =>
            c.type !== 'hero' &&
            c.faction !== 'hero' &&
            !isExcludedSet(c.set) &&
            !(c.set && heroSets.has(c.set)) &&
            (!fitsDeck || canInclude(c, hero, deck)) &&
            (!types.length || types.includes(c.type)) &&
            (!aspects.length || aspects.includes(c.faction)) &&
            (pack === 'all' || c.pack === pack) &&
            (cost === 'all' || String(c.cost) === cost) &&
            matchesQuery(c, query),
        ),
        sortKey,
        sortDir,
      ),
    [cards, heroSets, hero, deck, query, cost, pack, types, aspects, fitsDeck, sortKey, sortDir],
  );

  /** 필터 하나 바꾸기. keepVisible 이 아니면 목록을 처음 24장으로 되돌린다. */
  const setFilter = (key, value, keepVisible) => {
    setFilters((f) => ({ ...f, [key]: value }));
    if (!keepVisible) setVisible(PAGE);
    if (REMEMBERED.includes(key)) updatePrefs({ [key]: value });
  };
  const resetFilters = () => {
    setFilters((f) => ({ ...DEFAULT_FILTERS, sortKey: f.sortKey, sortDir: f.sortDir, view: f.view }));
    setVisible(PAGE);
  };

  const setCount = (id, n) => {
    if (!isSignature(cards.find((c) => c.id === id), hero)) setDeck((d) => ({ ...d, counts: { ...d.counts, [id]: n } }));
  };
  const adjustCount = (id, delta) => {
    if (!isSignature(cards.find((c) => c.id === id), hero))
      setDeck((d) => ({ ...d, counts: { ...d.counts, [id]: Math.max(0, (d.counts[id] || 0) + delta) } }));
  };
  const clearAdded = () => {
    setDeck((d) => ({
      ...d,
      counts: Object.fromEntries(
        Object.entries(d.counts).filter(([id]) => {
          const c = cards.find((x) => x.id === id);
          return c && isSignature(c, hero);
        }),
      ),
    }));
  };

  /** 히어로 바꾸기: 전용 카드만 새 히어로 것으로 바꾸고 나머지 카드는 둔다 */
  const changeHero = (heroId) => {
    setDeck((prev) => {
      const fresh = newDeck(cards, heroId);
      return {
        ...fresh,
        memo: prev.memo,
        isPublic: prev.isPublic,
        aspect: prev.aspect,
        counts: {
          ...Object.fromEntries(Object.entries(prev.counts).filter(([id]) => cards.find((c) => c.id === id)?.faction !== 'hero')),
          ...fresh.counts,
        },
      };
    });
    setNotice('히어로 전용 카드를 교체했습니다. 나머지 카드는 유지됩니다.');
    setVisible(PAGE);
  };

  async function importFile(file) {
    if (!file) return;
    try {
      if (file.size > 1e6) throw Error('덱 파일은 1MB 이하여야 합니다.');
      setDeck(parseDeckFile(JSON.parse(await file.text()), cards));
      setNotice('덱을 불러왔습니다.');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : '파일을 읽지 못했습니다.');
    }
  }

  const closeModal = () => setModal(null);

  return (
    <main>
      <header className="topbar">
        <span className="apptitle">
          마블 챔피언스
          <br className="mobilebreak" /> 한글 덱 빌더
        </span>
        <nav className="topnav">
          <button type="button" className={modal === 'decks' ? 'on' : ''} onClick={() => setModal('decks')}>
            공개 덱
          </button>
          <button type="button" className={modal === 'stats' ? 'on' : ''} onClick={() => setModal('stats')}>
            인기 통계
          </button>
        </nav>
      </header>
      <div className="workspace">
        <Library
          cards={cards}
          packs={packs}
          shown={shown}
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          visible={visible}
          showMore={() => setVisible((n) => n + PAGE)}
          hero={hero}
          deck={deck}
          onSetCount={setCount}
          onOpenCard={setDetailCard}
          popup={popup}
        />
        <CardPopup popup={popup} faces={(h) => otherHeroFaces(cards, h)} />
        {modal === 'heroes' ? (
          <HeroPicker
            heroes={heroes}
            currentId={deck.hero}
            popup={popup}
            onPick={(id) => {
              if (id !== deck.hero) changeHero(id);
              closeModal();
            }}
            onClose={closeModal}
          />
        ) : null}
        {modal === 'decks' ? (
          <PublicDecks
            cards={cards}
            heroes={heroes}
            currentHero={hero}
            popup={popup}
            onLoad={(code) => online.load(code)}
            onClose={closeModal}
          />
        ) : null}
        {modal === 'stats' ? (
          <Stats cards={cards} heroes={heroes} deckAspect={deck.aspect} popup={popup} onClose={closeModal} />
        ) : null}
        <DeckPanel
          cards={cards}
          hero={hero}
          deck={deck}
          setDeck={setDeck}
          faces={otherHeroFaces(cards, hero)}
          subdeck={subdeckCards(cards, hero)}
          size={size}
          issues={issues}
          inDeck={inDeck}
          notice={notice}
          online={online}
          onOpenHeroPicker={() => setModal('heroes')}
          onOpenCard={setDetailCard}
          onAdjust={adjustCount}
          onClearAdded={clearAdded}
          onImportFile={importFile}
          onNotice={setNotice}
          grouping={prefs.deckGrouping || 'split'}
          setGrouping={(g) => updatePrefs({ deckGrouping: g })}
          popup={popup}
        />
      </div>
      <CardDetail card={detailCard} onClose={() => setDetailCard(null)} />
    </main>
  );
}
