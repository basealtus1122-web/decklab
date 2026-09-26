// 인기 통계: 온라인에 저장된 모든 덱(비공개 포함, 합계만)을 센 결과
import { useState, useEffect } from '../vendor.js';
import { ASPECTS, FACTION_COLOR, FACTION_LABEL, TYPE_LABEL, cardName } from '../cards.js';
import { call } from '../online.js';
import { Modal } from './Modal.jsx';

// 서버도 10분 동안 캐시하므로 창을 다시 열 때마다 부르지 않는다
let cached = null;

const pct = (n) => (n >= 0.995 ? '100%' : n >= 0.1 ? Math.round(n * 100) + '%' : (n * 100).toFixed(1) + '%');
const CARD_PAGE = 40;

function Bar({ value, max, color, segments }) {
  const width = max ? Math.max(1.5, (value / max) * 100) : 0;
  return (
    <span className="stbar" aria-hidden="true">
      <span className="stfill" style={{ width: width + '%', background: segments ? 'none' : color || '#6fa8e0' }}>
        {segments
          ? segments.map((s) => <span key={s.key} style={{ flexGrow: s.value, background: s.color }} title={s.title} />)
          : null}
      </span>
    </span>
  );
}

function HeroTab({ stats, heroesById }) {
  const rows = Object.entries(stats.heroes)
    .map(([id, h]) => ({ id, name: heroesById[id] ? cardName(heroesById[id]) : h.name || id, count: h.count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));
  const max = rows.length ? rows[0].count : 0;
  return (
    <ol className="strows">
      {rows.map((r, i) => {
        const segments = ASPECTS.map((a) => ({
          key: a,
          value: stats.heroAspects[r.id + '|' + a] || 0,
          color: FACTION_COLOR[a],
          title: `${FACTION_LABEL[a]} ${stats.heroAspects[r.id + '|' + a] || 0}`,
        })).filter((s) => s.value);
        return (
          <li key={r.id}>
            <span className="strank">{i + 1}</span>
            <span className="stname">{r.name}</span>
            <Bar value={r.count} max={max} segments={segments} />
            <span className="stnum">
              {r.count}덱 <small>{pct(r.count / stats.totalDecks)}</small>
            </span>
            <span className="staspects">
              {segments.map((s) => (
                <span key={s.key} className={'ctfac f-' + s.key}>
                  {FACTION_LABEL[s.key]} {s.value}
                </span>
              ))}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AspectTab({ stats }) {
  const rows = ASPECTS.map((a) => ({ a, count: stats.aspects[a] || 0 })).sort((x, y) => y.count - x.count);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <>
      <ol className="strows">
        {rows.map((r, i) => (
          <li key={r.a}>
            <span className="strank">{i + 1}</span>
            <span className={'stname ctfac f-' + r.a}>{FACTION_LABEL[r.a]}</span>
            <Bar value={r.count} max={max} color={FACTION_COLOR[r.a]} />
            <span className="stnum">
              {r.count}덱 <small>{pct(r.count / stats.totalDecks)}</small>
            </span>
          </li>
        ))}
      </ol>
      <p className="stnote">두 성향을 쓰는 덱(스파이더우먼 등)은 양쪽에 모두 셉니다.</p>
    </>
  );
}

function CardTab({ stats, cards, popup, initialFaction }) {
  const [faction, setFaction] = useState(initialFaction);
  const [shown, setShown] = useState(CARD_PAGE);

  // 채용률 = 그 카드를 넣은 덱 ÷ 그 카드를 넣을 수 있는 덱(기본은 전체, 성향 카드는 그 성향 덱)
  const rows = cards
    .filter((c) => c.type !== 'hero' && c.faction !== 'hero' && stats.cardDecks[c.id])
    .filter((c) => faction === 'all' || c.faction === faction)
    .map((c) => {
      const pool = c.faction === 'basic' ? stats.totalDecks : stats.aspects[c.faction] || 0;
      const decks = stats.cardDecks[c.id];
      return { card: c, decks, pool, rate: pool ? Math.min(1, decks / pool) : 0, avg: (stats.cardCopies[c.id] || 0) / decks };
    })
    .sort((a, b) => b.rate - a.rate || b.decks - a.decks || cardName(a.card).localeCompare(cardName(b.card), 'ko'));

  return (
    <>
      <div className="tgroup stchips">
        {['all', 'basic', ...ASPECTS].map((f) => (
          <button
            key={f}
            type="button"
            className={'tg' + (f === 'all' ? ' all' : ' asp-' + f) + (faction === f ? ' on' : '')}
            aria-pressed={faction === f}
            onClick={() => {
              setFaction(f);
              setShown(CARD_PAGE);
            }}
          >
            {f === 'all' ? '전부' : FACTION_LABEL[f]}
          </button>
        ))}
      </div>
      {rows.length ? (
        <ol className="strows stcards">
          {rows.slice(0, shown).map((r, i) => (
            <li key={r.card.id}>
              <span className="strank">{i + 1}</span>
              <span className="stname" tabIndex={0} {...popup.bind(r.card)}>
                {cardName(r.card)}
                <small>
                  <span className={'ctfac f-' + r.card.faction}>{FACTION_LABEL[r.card.faction]}</span> · {TYPE_LABEL[r.card.type]}
                </small>
              </span>
              <Bar value={r.rate} max={1} color={FACTION_COLOR[r.card.faction]} />
              <span className="stnum">
                {pct(r.rate)}{' '}
                <small>
                  {r.decks}/{r.pool}덱 · 평균 {r.avg.toFixed(1)}장
                </small>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="pdempty">아직 이 성향 카드를 쓴 덱이 없습니다.</p>
      )}
      {rows.length > shown ? (
        <button type="button" className="secondary loadmore" onClick={() => setShown((n) => n + CARD_PAGE)}>
          더 보기 · {shown} / {rows.length}
        </button>
      ) : null}
      <p className="stnote">채용률 = 그 카드를 넣은 덱 ÷ 넣을 수 있는 덱(기본 카드는 전체 덱, 성향 카드는 그 성향을 고른 덱). 히어로 전용 카드는 뺐습니다.</p>
    </>
  );
}

const TABS = [
  ['cards', '카드 채용률'],
  ['heroes', '히어로'],
  ['aspects', '성향'],
];

export function Stats({ cards, heroes, deckAspect, onClose, popup }) {
  const [state, setState] = useState(cached ? { status: 'ok', stats: cached } : { status: 'loading' });
  const [tab, setTab] = useState('cards');
  const heroesById = Object.fromEntries(heroes.map((h) => [h.id, h]));

  useEffect(() => {
    if (cached) return undefined;
    let alive = true;
    call('stats')
      .then((j) => {
        cached = j;
        if (alive) setState({ status: 'ok', stats: j });
      })
      .catch((e) => alive && setState({ status: 'error', error: e.message }));
    return () => {
      alive = false;
    };
  }, []);

  const tabs = (
    <div className="viewtoggle sttabs" role="tablist">
      {TABS.map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
          {label}
        </button>
      ))}
    </div>
  );

  let body;
  const stats = state.stats;
  if (state.status === 'loading') body = <p className="pdempty">통계를 불러오는 중…</p>;
  else if (state.status === 'error') body = <p className="pdempty">{state.error}</p>;
  else if (!stats.totalDecks) body = <p className="pdempty">아직 온라인에 저장된 덱이 없습니다.</p>;
  else if (tab === 'heroes') body = <HeroTab stats={stats} heroesById={heroesById} />;
  else if (tab === 'aspects') body = <AspectTab stats={stats} />;
  else body = <CardTab stats={stats} cards={cards} popup={popup} initialFaction={ASPECTS.includes(deckAspect) ? deckAspect : 'all'} />;

  return (
    <Modal
      title="인기 통계"
      className="stbox"
      onClose={onClose}
      head={tabs}
      foot={
        stats
          ? `저장된 덱 ${stats.totalDecks.toLocaleString()}개 기준(비공개 덱 포함, 합계만 공개) · ${String(stats.generatedAt || '').slice(0, 16)} 집계 · 10분마다 갱신`
          : '온라인에 저장된 덱을 모아 셉니다.'
      }
    >
      <div className="pdbody stbody">{body}</div>
    </Modal>
  );
}
