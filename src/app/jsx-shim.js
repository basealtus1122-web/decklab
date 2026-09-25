// JSX(<div>…</div>)가 React.createElement 로 바뀌도록 esbuild 가 모든 파일에 자동으로 넣는다
import { React } from './vendor.js';

export const h = React.createElement;
export const Fragment = React.Fragment;
