// 덱랩 시작점
import { createRoot } from './vendor.js';
import cards from '../data/cards.json';
import { App } from './App.jsx';

createRoot(document.getElementById('root')).render(<App cards={cards} />);
