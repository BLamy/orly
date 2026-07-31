import { useEffect, type RefObject } from 'react';
import { authorizeVibrations } from 'ios-vibrator-pro-max/dist/methods/click-grant/index.js';
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

  // Match the package's real entry point: on newer Safari releases a native
  // switch vibration is only permitted inside a recent trusted interaction.
  // Keeping this authorization path is what makes click haptics deterministic;
  // the previous scoped version only stored the requested pattern.
  window.addEventListener('click', authorizeVibrations);
  window.addEventListener('touchend', authorizeVibrations);
  window.addEventListener('keyup', authorizeVibrations);
  window.addEventListener('keypress', authorizeVibrations);
  installed = true;
}

export function useIOSVibrator() {
  useEffect(() => {
    installScopedPolyfill();
  }, []);
}

export function useScopedIOSVibrator(ref: RefObject<HTMLElement | null>) {
  useIOSVibrator();

  useEffect(() => {
    const element = ref.current;
    if (!element || !polyfillKind) return;
    return handleAddElement(element);
  }, [ref]);
}
