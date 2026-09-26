// 왼쪽 카드 목록: 검색, 필터, 정렬, 목록/카드 보기
import { Checkbox, Icon } from '../vendor.js';
import { DATA_DATE } from '../config.js';
import { FACTION_LABEL, TYPE_LABEL, SORTS, cardImage, cardName, costLabel } from '../cards.js';
import { Picker, QuantityButtons, resourceIcons } from './common.jsx';
import { RichText } from './RichText.jsx';

const COST_OPTIONS = [
  ['all', '모든 비용'],
  ...Array.from({ length: 9 }, (_, n) => [String(n), `비용 ${n}`]),
  ['-1', '비용 X'],
  ['null', '비용 없음'],
];

const TYPE_FILTERS = [
  ['ally', '동료'],
  ['event', '이벤트'],
  ['upgrade', '업그레이드'],
  ['support', '지원'],
  ['resource', '자원'],
  ['player_side_scheme', '플레이어 부가 음모'],
];

export function Library({ cards, packs, shown, filters, setFilter, resetFilters, visible, showMore, hero, deck, onSetCount, onOpenCard, popup }) {
  const { query, cost, pack, types, aspects, sortKey, sortDir, view, fitsDeck } = filters;
  const qty = (card) => <QuantityButtons card={card} hero={hero} deck={deck} onSet={onSetCount} />;

  return (
    <section className="library">
      <div className="libraryhead">
        <div className="eyebrow">CARD LIBRARY</div>
        <span className="catalog-count">한글 {cards.filter((c) => c.nameKo).length.toLocaleString()}종</span>
      </div>

      <div className="searchbox">
        <Icon.Search size={20} />
        <input
          aria-label="카드 이름·효과 검색"
          placeholder="카드 이름, 효과, 특성 검색"
          value={query}
          onChange={(ev) => setFilter('query', ev.target.value)}
        />
      </div>

      <div className="filters">
        <Picker label="카드 비용" value={cost} onChange={(v) => setFilter('cost', v)} options={COST_OPTIONS} />
        <Picker
          label="확장팩"
          value={pack}
          onChange={(v) => setFilter('pack', v)}
          options={[['all', '모든 확장팩'], ...packs.map((p) => [p, p])]}
        />
      </div>

      <div className="togglebar">
        <div className="tgroup">
          <span className="tglabel">유형</span>
          <button type="button" className={'tg all' + (types.length ? '' : ' on')} aria-pressed={!types.length} onClick={() => setFilter('types', [])}>
            전부
          </button>
          {TYPE_FILTERS.map(([type, label]) => {
            const on = types.includes(type);
            return (
              <button
                key={type}
                type="button"
                className={'tg' + (on ? ' on' : '')}
                aria-pressed={on}
                onClick={() => setFilter('types', on ? [] : [type])}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="tgroup">
          <span className="tglabel">성향</span>
          {Object.entries(FACTION_LABEL)
            .filter(([f]) => f !== 'hero')
            .map(([f, label]) => {
              const on = aspects.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  className={'tg asp-' + f + (on ? ' on' : '')}
                  aria-pressed={on}
                  onClick={() => setFilter('aspects', on ? aspects.filter((x) => x !== f) : [...aspects, f])}
                >
                  {label}
                </button>
              );
            })}
        </div>
      </div>

      <div className="filtermeta">
        <div className="sortbar">
          <span>정렬</span>
          <select className="sortsel" aria-label="정렬 기준" value={sortKey} onChange={(ev) => setFilter('sortKey', ev.target.value)}>
            {SORTS.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="sortdir"
            aria-label="오름차순 내림차순 전환"
            onClick={() => setFilter('sortDir', sortDir === 'asc' ? 'desc' : 'asc')}
          >
            {sortDir === 'asc' ? '↑ 오름' : '↓ 내림'}
          </button>
        </div>
        <div className="viewtoggle">
          <button type="button" className={view === 'grid' ? 'on' : ''} aria-pressed={view === 'grid'} onClick={() => setFilter('view', 'grid', true)}>
            카드
          </button>
          <button type="button" className={view === 'list' ? 'on' : ''} aria-pressed={view === 'list'} onClick={() => setFilter('view', 'list', true)}>
            목록
          </button>
        </div>
        <label>
          <Checkbox checked={fitsDeck} onCheckedChange={(v) => setFilter('fitsDeck', !!v, true)} /> 현재 덱에 맞는 카드
        </label>
        <span>{shown.length.toLocaleString()}종</span>
        <button aria-label="검색 필터 초기화" onClick={resetFilters}>
          <Icon.RotateCcw size={15} />
        </button>
      </div>

      {view === 'list' ? (
        <div className="cardtable">
          <div className="ctrow cthead">
            <span>수량</span>
            <span>이름</span>
            <span>자원</span>
            <span>비용</span>
            <span>유형</span>
            <span>성향</span>
          </div>
          {shown.slice(0, visible).map((c) => (
            <div key={c.id} className={'ctrow' + (deck.counts[c.id] ? ' in' : '')}>
              {qty(c)}
              <button className="ctname" {...popup.bind(c)} onClick={() => onOpenCard(c)}>
                {c.unique ? '● ' : ''}
                {cardName(c)}
              </button>
              <span className="ctres">{resourceIcons(c)}</span>
              <span className="ctcost">{costLabel(c)}</span>
              <span className="cttype">{TYPE_LABEL[c.type]}</span>
              <span className={'ctfac f-' + c.faction}>{FACTION_LABEL[c.faction]}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="cardgrid">
          {shown.slice(0, visible).map((c) => (
            <article key={c.id} className={'gamecard ' + c.faction}>
              <div>
                <span className="cost" title="카드 비용">
                  {c.cost === -1 ? 'X' : c.cost ?? '—'}
                </span>
                <small>
                  {FACTION_LABEL[c.faction]} · {TYPE_LABEL[c.type]}
                </small>
                {resourceIcons(c)}
                {/* 카드 보기는 글자가 이미 다 보이므로, 카드 이미지가 있을 때만 팝업을 띄운다 */}
                <button className="cardtitle" onClick={() => onOpenCard(c)} {...(cardImage(c) ? popup.bind(c) : {})}>
                  <h2>
                    {c.unique ? '◆ ' : ''}
                    {cardName(c)}
                  </h2>
                </button>
                <div className="english">{c.nameKo ? c.name : '영문 카드 · 시트 번역 미연결'}</div>
                <div className="traits">{c.traitsKo || c.traits || '특성 없음'}</div>
                <p className="effect">
                  <RichText text={c.textKo || c.text || '효과 텍스트 없음'} />
                </p>
              </div>
              <div className="cardbottom">
                <button className="detailbutton" onClick={() => onOpenCard(c)}>
                  상세 보기
                </button>
                <div className="counter">{qty(c)}</div>
              </div>
            </article>
          ))}
        </div>
      )}

      {shown.length === 0 && (
        <div className="empty">
          <Icon.Search size={28} />
          <h2>검색 결과가 없습니다.</h2>
          <p>다른 검색어를 입력하거나 필터를 초기화해 보세요.</p>
          <button className="secondary" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
      )}
      {shown.length > visible && (
        <button className="loadmore secondary" onClick={showMore}>
          카드 더 보기 · {Math.min(visible, shown.length)} / {shown.length}
        </button>
      )}

      <footer>
        <p>{DATA_DATE} 시트 사본 기준 · 실시간 동기화 아님</p>
        <p>
          번역: <span>사용자 제공 시트</span> · 카드 수치:{' '}
          <a href="https://marvelcdb.com" target="_blank" rel="noreferrer">
            MarvelCDB
          </a>
          <br />
          전체 시트 중 카드 정보와 연결된 플레이어 카드만 수록했습니다. 비공식 팬 도구입니다.
        </p>
      </footer>
    </section>
  );
}
