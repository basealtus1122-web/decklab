// 카드 상세 (오른쪽에서 열리는 시트)
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../vendor.js';
import { FACTION_LABEL, TYPE_LABEL, cardName } from '../cards.js';
import { resourceIcons } from './common.jsx';

export function CardDetail({ card, onClose }) {
  return (
    <Sheet open={!!card} onOpenChange={(open) => open || onClose()}>
      <SheetContent className="carddetail">
        {card && (
          <>
            <SheetHeader>
              <SheetTitle className="detailtitle">{cardName(card)}</SheetTitle>
              <SheetDescription>
                {card.name} · {card.subname}
              </SheetDescription>
            </SheetHeader>
            <div className="detailbody">
              <div className="badges">
                <span>{FACTION_LABEL[card.faction]}</span>
                <span>{TYPE_LABEL[card.type]}</span>
                <span>비용 {card.cost === -1 ? 'X' : card.cost ?? '—'}</span>
                {resourceIcons(card) && <span className="resbadge">{resourceIcons(card)}</span>}
              </div>
              <b>{card.traitsKo || card.traits}</b>
              <p>{card.textKo || card.text}</p>
              <h3>영문 원문</h3>
              <p>{card.text}</p>
              {card.type === 'hero' && <p>{card.alterText}</p>}
              <hr />
              <p className="metadata">
                {card.pack} · {card.id}
                <br />
                동명 제한 {card.limit || 3}장{card.permanent ? ' · 영속' : ''}
                <br />
                {card.sheet ? `번역: ${card.sheet} / ${card.row}행` : '한글 번역 미연결'}
              </p>
              <a href={card.url} target="_blank" rel="noreferrer">
                원본 카드 보기 ↗
              </a>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
