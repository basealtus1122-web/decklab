// JSX(<div>…</div>)가 React.createElement 로 바뀌도록 esbuild 가 모든 파일에 자동으로 넣는다.
// 이름을 특이하게 지은 것은 코드 안의 변수(h 등)에 가려지지 않게 하려는 것.
import { React } from './vendor.js';

export const __jsx = React.createElement;
export const __Fragment = React.Fragment;
