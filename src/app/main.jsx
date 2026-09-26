// 덱랩 시작점
import { createRoot } from './vendor.js';
import rawCards from '../data/cards.json';
import cardFixes from '../data/card-fixes.json';
import { prepareCards } from './cardText.js';
import { App } from './App.jsx';

// 번역 교정(src/data/card-fixes.json)을 적용하고 아이콘 표기를 통일한다
const cards = prepareCards(rawCards, cardFixes);

createRoot(document.getElementById('root')).render(<App cards={cards} />);
