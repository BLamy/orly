import { useEffect, type RefObject } from 'react';
import {
  handleAddElement,
  triggersRoot,
} from 'ios-vibrator-pro-max/dist/methods/click-passthrough/index.js';
import { polyfillKind } from 'ios-vibrator-pro-max/dist/utils/supported-versions.js';
import { setVibration } from 'ios-vibrator-pro-max/dist/vibration.js';

let installed = false;

function installScopedPolyfill() {
  if (!polyfillKind || installed) return;

  // The package's default entry point reparents and observes the whole body.
  // Its demo only needs the switch-backed trigger behavior, so install that
  // machinery without taking ownership of the rest of the application DOM.
  document.body.appendChild(triggersRoot);
  navigator.vibrate = (rawPattern) => {
    const pattern = typeof rawPattern === 'number' ? [rawPattern] : [...rawPattern];
    if (!pattern.length || pattern.some((duration) => typeof duration !== 'number')) return false;
    setVibration(pattern);
    return true;
  };
  installed = true;
}

export function useScopedIOSVibrator(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    installScopedPolyfill();
    const element = ref.current;
    if (!element || !polyfillKind) return;
    return handleAddElement(element);
  }, [ref]);
}
