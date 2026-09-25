// 온라인 저장·불러오기·삭제 상태
import { useState } from './vendor.js';
import { aspectCount, cardName } from './cards.js';
import { DECK_CODE_RE, call, editKeyFor, forgetDeck, myDecks, rememberDeck } from './online.js';

function setHash(hash) {
  try {
    history.replaceState(null, '', hash || location.pathname + location.search);
  } catch (e) {}
}

/**
 * link: 지금 화면의 덱이 연결된 온라인 덱 { code, key, readOnly, copiedFrom } 또는 null
 *   - key 가 있고 readOnly 가 아니면 내 덱 → 저장하면 덮어쓴다
 *   - readOnly 면 남의 덱 → 저장하면 복사본이 새 코드로 만들어진다
 */
export function useOnlineDeck({ heroes, hero, deck, setDeck, inDeck, onLoaded }) {
  const [link, setLink] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [mine, setMine] = useState(myDecks);
  const [codeInput, setCodeInput] = useState('');

  const isOwner = !!(link && link.key && !link.readOnly);

  const payload = () => ({
    name: deck.name,
    memo: deck.memo || '',
    hero: deck.hero,
    heroName: cardName(hero),
    aspect: deck.aspect,
    secondAspect: aspectCount(hero) === 2 ? deck.secondAspect || '' : '',
    counts: deck.counts,
    isPublic: deck.isPublic !== false,
    copiedFrom: link && link.readOnly ? link.code : (link && link.copiedFrom) || '',
    summary: inDeck.map((c) => deck.counts[c.id] + 'x ' + cardName(c)).join('\n'),
  });

  function save() {
    if (busy) return;
    const own = isOwner;
    const pay = payload();
    if (!String(deck.name || '').trim()) {
      setStatus('덱 이름을 입력하세요.');
      return;
    }
    setBusy(true);
    setStatus(own ? '수정 저장 중…' : '저장 중…');
    (own ? call('update', { code: link.code, editKey: link.key, deck: pay }) : call('create', { deck: pay }))
      .then((j) => {
        const code = own ? link.code : j.code;
        const key = own ? link.key : j.editKey;
        rememberDeck({ code, key, name: deck.name, heroName: cardName(hero), at: Date.now() });
        setMine(myDecks());
        setLink({ code, key, readOnly: false, copiedFrom: pay.copiedFrom });
        setHash('#deck=' + code);
        setStatus(own ? '수정 내용을 저장했습니다.' : '저장했습니다. 덱 코드는 ' + code + ' 입니다.');
      })
      .catch((x) => setStatus(x.message))
      .finally(() => setBusy(false));
  }

  function load(rawCode, key) {
    const code = String(rawCode || '')
      .trim()
      .toUpperCase();
    if (!DECK_CODE_RE.test(code)) {
      setStatus('덱 코드 형식이 올바르지 않습니다. 예: XDGD-QW4F');
      return;
    }
    if (busy) return;
    setBusy(true);
    setStatus('불러오는 중…');
    call('get', { code })
      .then((j) => {
        const d = j.deck;
        if (!heroes.some((x) => x.id === d.hero)) throw new Error('이 덱의 히어로를 찾을 수 없습니다.');
        const k = key || editKeyFor(code);
        setDeck({
          version: 1,
          name: d.name,
          memo: d.memo || '',
          isPublic: d.isPublic,
          hero: d.hero,
          aspect: d.aspect,
          secondAspect: d.secondAspect || 'justice',
          counts: d.counts || {},
        });
        if (key) {
          rememberDeck({ code, key, name: d.name, heroName: d.heroName, at: Date.now() });
          setMine(myDecks());
        }
        setLink({ code, key: k, readOnly: !k, copiedFrom: d.copiedFrom || '' });
        setCodeInput('');
        onLoaded();
        setHash('#deck=' + code);
        setStatus(
          k
            ? '내 덱을 불러왔습니다. 고친 뒤 저장하면 이 코드에 덮어씁니다.'
            : '다른 사람의 덱이라 읽기 전용입니다. 저장하면 새 코드의 복사본이 만들어집니다.',
        );
      })
      .catch((x) => setStatus(x.message))
      .finally(() => setBusy(false));
  }

  function remove() {
    if (!isOwner || busy) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setTimeout(() => setDeleteArmed(false), 3000);
      return;
    }
    setDeleteArmed(false);
    setBusy(true);
    setStatus('삭제 중…');
    const code = link.code;
    call('delete', { code, editKey: link.key })
      .then(() => {
        forgetDeck(code);
        setMine(myDecks());
        setLink(null);
        setHash('');
        setStatus('온라인 덱을 삭제했습니다. 화면의 카드 구성은 그대로 남아 있습니다.');
      })
      .catch((x) => setStatus(x.message))
      .finally(() => setBusy(false));
  }

  function unlink() {
    setLink(null);
    setStatus('연결을 끊었습니다. 저장하면 지금 구성으로 새 코드를 받습니다.');
  }

  function forget(code) {
    forgetDeck(code);
    setMine(myDecks());
  }

  return { link, isOwner, status, setStatus, busy, deleteArmed, mine, codeInput, setCodeInput, save, load, remove, unlink, forget };
}
