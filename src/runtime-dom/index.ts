import { createRenderer } from '../runtime-core';

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, oldValue, newValue) {
  const isOn = (key) => /^on[A-Z]/.test(key);

  if (isOn(key)) {
    const event = key.slice(2).toLocaleLowerCase();
    el.addEventListener(event, newValue);
  } else {
    if (newValue === undefined || newValue === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, newValue);
    }
  }
}

function insert(el, parent) {
  parent.append(el);
}

export const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from '../runtime-core';
