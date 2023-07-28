import { extend, isObject } from '../shared';
import { track, trigger } from './effect';
import { ReactiveFlags, reactive, readonly } from './reactive';

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function (target, key) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    const res = Reflect.get(target, key);

    if (shallow) {
      return res;
    }
    // 依赖收集
    if (!isReadonly) {
      track(target, key);
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

function createSetter() {
  return function (target, key, value) {
    // 依赖触发
    const res = Reflect.set(target, key, value);
    trigger(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get,
  set
};

export const readonlyHandlers = {
  get: readonlyGet,
  set: (target, _key, _value) => {
    console.warn('warn: set attribute on readonly object', target);
    return true;
  }
};

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet
});
