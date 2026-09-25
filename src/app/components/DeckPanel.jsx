// 오른쪽 덱 패널
import { useState, useRef, Progress, Icon } from '../vendor.js';
import { RULES_URL } from '../config.js';
import {
  ASPECTS,
  FACTION_COLOR,
  FACTION_LABEL,
  FACTION_ORDER,
  RESOURCES,
  TYPE_LABEL,
  aspectCount,
  canInclude,
  cardName,
  copyLimit,
  isSignature,
} from '../cards.js';
import { DECK_MAX, deckText, downloadText } from '../deck.js';
import { BarChart, Picker, ResourceIcon, resourceIcons } from './common.jsx';
import { OnlinePanel } from './OnlinePanel.jsx';

const ASPECT_OPTIONS = ASPECTS.map((a) => [a, FACTION_LABEL[a]]);
const DECK_GROUPS = ['hero', 'ally', 'event', 'support', 'upgrade', 'resource', 'player_side_scheme'];

/** 히어로 능력 접는 칸 */
function HeroInfo({ hero, faces }) {
  return (
    <details className="heroinfo">
      <summary>일상 / 히어로</summary>
      <div className="hiname">
        {hero.unique ? '◆ ' : ''}
        {cardName(hero)}
        {hero.subname ? <small> · {hero.subKo || hero.subname}</small> : null}
      </div>
      <div className="hitraits">{hero.traitsKo || hero.traits || ''}</div>
      {hero.alterTextKo || hero.alterText ? (
        <>
          <div className="hiside">일상</div>
          <p>{hero.alterTextKo || hero.alterText}</p>
        </>
      ) : null}
      <div className="hiside">히어로</div>
      <p>{hero.textKo || hero.text || '-'}</p>
      {faces.map((face, i) => (
        <div key={face.id} className="hiextra">
          <div className="hiside">{cardName(face) !== cardName(hero) ? cardName(face) : '히어로 면 ' + (i + 2)}</div>
          <div className="hitraits">{face.traitsKo || face.traits || ''}</div>
          <p>{face.textKo || face.text || '-'}</p>
          {face.alterTextKo || face.alterText ? <p>{face.alterTextKo || face.alterText}</p> : null}
        </div>
      ))}
    </details>
  );
}

function DeckList({ hero, deck, inDeck, subdeck, onOpenCard, onAdjust }) {
  const total = (list) => list.reduce((n, c) => n + deck.counts[c.id], 0);
  return (
    <>
      <div className="decklist">
        {DECK_GROUPS.map((group) => {
          const list = inDeck.filter((c) => (group === 'hero' ? isSignature(c, hero) : !isSignature(c, hero) && c.type === group));
          if (!list.length) return null;
          return (
            <div key={group} className="deckgroup">
              <h3>
                {group === 'hero' ? '히어로 전용' : TYPE_LABEL[group]} <span>{total(list)}장</span>
              </h3>
              {list.map((c) => (
                <div key={c.id} className="deckrow">
                  <button className="deckcard" onClick={() => onOpenCard(c)}>
                    <em>{deck.counts[c.id]}x</em>
                    {c.unique ? '● ' : ''}
                    {cardName(c)}
                    {c.permanent && <small> 영속</small>}
                  </button>
                  {resourceIcons(c)}
                  {isSignature(c, hero) ? null : (
                    <div className="counter">
                      <button aria-label={`${cardName(c)} 덱에서 제거`} onClick={() => onAdjust(c.id, -1)}>
                        <Icon.Minus size={13} />
                      </button>
                      <b>{deck.counts[c.id]}</b>
                      <button
                        aria-label={`${cardName(c)} 덱에 추가`}
                        disabled={total(inDeck.filter((x) => x.name === c.name)) >= copyLimit(c, hero) || !canInclude(c, hero, deck)}
                        onClick={() => onAdjust(c.id, 1)}
                      >
                        <Icon.Plus size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      {subdeck.length ? (
        <div className="deckgroup subdeck">
          <h3>
            히어로 부속 덱 <span>{subdeck.reduce((n, c) => n + (c.quantity || 1), 0)}장</span>
          </h3>
          {subdeck.map((c) => (
            <div key={c.id} className="deckrow">
              <button className="deckcard" onClick={() => onOpenCard(c)}>
                <em>{c.quantity || 1}x</em>
                {cardName(c)}
              </button>
              {resourceIcons(c)}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

function DeckCharts({ deck, inDeck }) {
  const count = (test) => inDeck.reduce((n, c) => n + (test(c) ? deck.counts[c.id] || 0 : 0), 0);
  return (
    <details className="charts">
      <summary>덱 분석</summary>
      <BarChart
        title="비용"
        items={[0, 1, 2, 3, 4, 5].map((n) => ({
          l: n === 5 ? '5+' : String(n),
          v: count((c) => (n === 5 ? (c.cost || 0) >= 5 : c.cost === n)),
          c: '#6fa8e0',
        }))}
      />
      <BarChart
        title="성향"
        items={FACTION_ORDER.map((f) => ({ l: FACTION_LABEL[f], v: count((c) => c.faction === f), c: FACTION_COLOR[f] })).filter((x) => x.v > 0)}
      />
      <BarChart
        title="유형"
        items={['ally', 'event', 'support', 'upgrade', 'resource', 'player_side_scheme']
          .map((t) => ({ l: TYPE_LABEL[t], v: count((c) => c.type === t), c: '#8fa3bf' }))
          .filter((x) => x.v > 0)}
      />
    </details>
  );
}

export function DeckPanel({
  cards,
  hero,
  deck,
  setDeck,
  faces,
  subdeck,
  size,
  issues,
  inDeck,
  notice,
  online,
  onOpenHeroPicker,
  onOpenCard,
  onAdjust,
  onClearAdded,
  onImportFile,
  onNotice,
}) {
  const [clearArmed, setClearArmed] = useState(false);
  const fileInput = useRef(null);
  const aspects = aspectCount(hero);
  const added = inDeck.reduce((n, c) => n + (!isSignature(c, hero) ? deck.counts[c.id] || 0 : 0), 0);

  const save = (text, ext) => {
    downloadText(text, deck.name, ext);
    onNotice('덱 파일을 다운로드했습니다. 불러오기는 JSON 파일을 사용하세요.');
  };

  return (
    <aside className="deckpanel">
      <div className="deckhead">
        <div className="eyebrow">YOUR DECK</div>
        <Icon.Shield size={20} />
      </div>
      <label className="sr-only" htmlFor="deck-name">
        덱 이름
      </label>
      <input id="deck-name" className="deckname" maxLength={100} value={deck.name} onChange={(ev) => setDeck({ ...deck, name: ev.target.value })} />

      <label className="fieldlabel">히어로</label>
      <button type="button" className="heropick" onClick={onOpenHeroPicker}>
        <b>{hero ? cardName(hero) : '히어로 선택'}</b>
        <span>{hero && hero.subname ? hero.subKo || hero.subname : ''}</span>
        <em>변경</em>
      </button>
      {hero && <HeroInfo hero={hero} faces={faces} />}

      <label className="fieldlabel">성향</label>
      {aspects >= 4 ? (
        <div className="aspectfixed">성향 4개를 같은 장수로 ('풀 포함 5개 중 4개)</div>
      ) : (
        <Picker label="성향 선택" value={deck.aspect} onChange={(v) => setDeck({ ...deck, aspect: v })} options={ASPECT_OPTIONS} />
      )}
      {aspects === 2 && (
        <>
          <label className="fieldlabel">두 번째 성향</label>
          <Picker label="두 번째 성향" value={deck.secondAspect} onChange={(v) => setDeck({ ...deck, secondAspect: v })} options={ASPECT_OPTIONS} />
        </>
      )}

      <div className="decktotal">
        <strong>
          {size}
          <small> / 40–50</small>
        </strong>
        <span>장</span>
      </div>
      <Progress aria-label="덱 장수" value={Math.min(size, DECK_MAX)} max={DECK_MAX} />
      <div className="ressum">
        {RESOURCES.map(([type, label]) => (
          <span key={type}>
            <ResourceIcon type={type} title={label} />
            <b>{inDeck.reduce((n, c) => n + ((c.resources && c.resources[type]) || 0) * (deck.counts[c.id] || 0), 0)}</b>
          </span>
        ))}
      </div>

      <button
        className={'clearbtn' + (clearArmed ? ' arm' : '')}
        type="button"
        onClick={() => {
          if (clearArmed) {
            onClearAdded();
            setClearArmed(false);
          } else {
            setClearArmed(true);
            setTimeout(() => setClearArmed(false), 3000);
          }
        }}
        disabled={!inDeck.some((c) => !isSignature(c, hero) && deck.counts[c.id])}
      >
        {clearArmed ? (
          '한 번 더 누르면 비웁니다'
        ) : (
          <>
            추가한 카드 비우기 <b>{added}</b>장
          </>
        )}
      </button>

      <div className="validation" aria-live="polite">
        <b>{issues.length ? '덱을 확인하세요' : '기본 구성 조건 충족'}</b>
        {issues.slice(0, 4).map((m, i) => (
          <p key={i}>{m}</p>
        ))}
        {issues.length > 4 && <p>추가 확인 항목 {issues.length - 4}개</p>}
      </div>
      <details className="rulesnote">
        <summary>규칙 검사 범위</summary>
        <p>레거시 카드 풀의 장수·성향·동명 카드 제한을 검사합니다. 영속 카드는 덱 장수에서 제외합니다.</p>
        <p>
          히어로별 추가 조건, 카드별 덱 편입 조건, 멀티플레이 팀업 교체와 최신 제한 환경은 직접 확인하세요. 이 결과는 전체 적법성 판정이
          아닙니다.
        </p>
        <a href={RULES_URL} target="_blank" rel="noreferrer">
          공식 규칙 1.8 안내 ↗
        </a>
      </details>

      <DeckList hero={hero} deck={deck} inDeck={inDeck} subdeck={subdeck} onOpenCard={onOpenCard} onAdjust={onAdjust} />
      <DeckCharts deck={deck} inDeck={inDeck} />
      <OnlinePanel deck={deck} setDeck={setDeck} online={online} />

      <div className="saveactions">
        <button className="primary" onClick={() => save(JSON.stringify(deck, null, 2), 'json')}>
          <Icon.Download size={16} /> 파일로 저장
        </button>
        <button className="secondary" onClick={() => fileInput.current?.click()}>
          <Icon.Upload size={16} /> 파일 불러오기
        </button>
        <button className="text-export" onClick={() => save(deckText(cards, hero, deck), 'txt')}>
          <Icon.FileText size={15} /> 텍스트 목록 내보내기
        </button>
      </div>
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        accept=".json,application/json"
        aria-label="덱 파일 불러오기"
        onChange={async (ev) => {
          await onImportFile(ev.target.files?.[0]);
          if (fileInput.current) fileInput.current.value = '';
        }}
      />
      <p className="savehint">
        덱 저장은 파일로 다운로드됩니다.
        <br />
        창을 닫기 전에 저장해 주세요.
      </p>
      <div role="status" className="notice">
        {notice}
      </div>
    </aside>
  );
}
