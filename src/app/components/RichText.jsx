// 카드 효과 글자를 그린다: [에너지]·[별] 같은 표기는 아이콘으로, [[공중]] 같은 특성은 굵게
import { ICONS, tokenize } from '../cardText.js';
import { ICON_SVG } from '../icons.js';

/** 글자 속 아이콘 하나 */
export function InlineIcon({ name }) {
  return (
    <span
      className={'ico ico-' + ICONS[name].en}
      role="img"
      aria-label={ICONS[name].title}
      title={ICONS[name].title}
      dangerouslySetInnerHTML={{ __html: ICON_SVG[name] }}
    />
  );
}

export function RichText({ text }) {
  if (!text) return null;
  return tokenize(text).map((t, i) =>
    t.icon ? (
      <InlineIcon key={i} name={t.icon} />
    ) : t.trait ? (
      <b key={i} className="trait">
        {t.trait}
      </b>
    ) : (
      t.text
    ),
  );
}
