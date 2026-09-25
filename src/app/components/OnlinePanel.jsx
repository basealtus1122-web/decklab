// 덱 패널의 "온라인 저장 · 공유" 칸
export function OnlinePanel({ deck, setDeck, online }) {
  const { link, isOwner, status, setStatus, busy, deleteArmed, mine, codeInput, setCodeInput } = online;

  const copy = (text, message) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (e) {}
    setStatus(message);
  };

  return (
    <details className="online">
      <summary>온라인 저장 · 공유</summary>
      <textarea
        className="memo"
        rows={3}
        maxLength={5000}
        placeholder="덱 메모 (선택)"
        value={deck.memo || ''}
        onChange={(ev) => setDeck({ ...deck, memo: ev.target.value })}
      />
      <label className="pubchk">
        <input type="checkbox" checked={deck.isPublic !== false} onChange={(ev) => setDeck({ ...deck, isPublic: ev.target.checked })} />
        {' 공개 목록에 올리기'}
      </label>
      <div className="onrow">
        <button type="button" className="primary" disabled={busy} onClick={online.save}>
          {isOwner ? '수정 저장' : link && link.readOnly ? '복사해서 새로 저장' : '온라인 저장'}
        </button>
        {isOwner ? (
          <button type="button" className="secondary" disabled={busy} onClick={online.unlink}>
            새 코드로
          </button>
        ) : null}
      </div>
      {link ? (
        <div className="oncode">
          <span>덱 코드</span>
          <b>{link.code}</b>
          {link.readOnly ? <small>읽기 전용</small> : null}
          <button type="button" onClick={() => copy(link.code, '덱 코드를 복사했습니다. 남에게 공유할 때 쓰세요.')}>
            코드 복사
          </button>
          {isOwner ? (
            <button
              type="button"
              onClick={() =>
                copy(
                  location.href.split('#')[0] + '#deck=' + link.code + '&key=' + link.key,
                  '편집 링크를 복사했습니다. 다른 기기에서 고칠 때 쓰시고, 남에게는 주지 마세요.',
                )
              }
            >
              편집 링크
            </button>
          ) : null}
          {isOwner ? (
            <button type="button" className={'ondel' + (deleteArmed ? ' arm' : '')} disabled={busy} onClick={online.remove}>
              {deleteArmed ? '한 번 더 누르면 삭제' : '삭제'}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="onload">
        <input
          value={codeInput}
          placeholder="덱 코드로 불러오기  예: XDGD-QW4F"
          maxLength={9}
          onChange={(ev) => setCodeInput(ev.target.value)}
          onKeyDown={(ev) => ev.key === 'Enter' && online.load(codeInput)}
        />
        <button type="button" className="secondary" disabled={busy} onClick={() => online.load(codeInput)}>
          불러오기
        </button>
      </div>
      {status ? <p className={'onstatus' + (busy ? ' busy' : '')}>{status}</p> : null}
      {mine.length ? (
        <details className="mydecks">
          <summary>{'이 브라우저의 내 덱 ' + mine.length + '개'}</summary>
          {mine.map((m) => (
            <div key={m.code} className="myrow">
              <button type="button" className="mypick" disabled={busy} onClick={() => online.load(m.code, m.key)}>
                <em>{m.code}</em>
                <span>{m.name}</span>
                <small>{m.heroName || ''}</small>
              </button>
              <button type="button" className="forget" aria-label={m.name + ' 목록에서 빼기'} onClick={() => online.forget(m.code)}>
                ×
              </button>
            </div>
          ))}
        </details>
      ) : null}
    </details>
  );
}
