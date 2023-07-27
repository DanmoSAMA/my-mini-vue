import { track, trigger } from './effect';

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
  return function (target, key) {
    // 依赖收集
    if (!isReadonly) {
      track(target, key);
    }
    return Reflect.get(target, key);
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
