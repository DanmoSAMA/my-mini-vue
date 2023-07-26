import { track, trigger } from './effect';

export function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      // 依赖收集
      track(target, key);
      return Reflect.get(target, key);
    },
    set(target, key, value) {
      // 依赖触发
      const res = Reflect.set(target, key, value);
      trigger(target, key);
      return res;
    }
  });
}
