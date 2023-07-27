import { mutableHandlers, readonlyHandlers } from './baseHandler';

export enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly'
}

export function reactive(raw) {
  return createReactiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createReactiveObject(raw, readonlyHandlers);
}

export function isReactive(value) {
  // 当传入原始对象时，直接访问该属性会得到undefined，需转换成false
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

function createReactiveObject(target, baseHandlers) {
  return new Proxy(target, baseHandlers);
}
