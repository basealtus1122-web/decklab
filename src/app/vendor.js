// 라이브러리 묶음(src/vendor/libs.js)이 window.DecklabVendor 로 넘겨준 것들
const V = window.DecklabVendor;

export const React = V.React;
export const { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } = V.React;
export const { createRoot } = V.ReactDOMClient;

// shadcn/ui 컴포넌트 (Base UI 기반)
export const {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Checkbox,
  Progress,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} = V.ui;

// lucide 아이콘: Search, RotateCcw, Shield, Minus, Plus, Download, Upload, FileText
export const Icon = V.icons;
