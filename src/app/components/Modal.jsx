// 가운데 뜨는 창 (히어로 선택, 공개 덱, 인기 통계)
import { useEffect } from '../vendor.js';

/**
 * head: 제목 옆에 들어갈 것 (검색칸 등), foot: 아래 줄
 * 바깥을 누르거나 Esc 를 누르면 닫힌다.
 */
export function Modal({ title, head, foot, onClose, className, children }) {
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === 'Escape' && !ev.defaultPrevented) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="heromodal"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div className={'hmbox' + (className ? ' ' + className : '')} role="dialog" aria-modal="true" aria-label={title}>
        <div className="hmhead">
          <h2>{title}</h2>
          {head}
          <button type="button" className="hmclose" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        {foot ? <p className="hmfoot">{foot}</p> : null}
      </div>
    </div>
  );
}
