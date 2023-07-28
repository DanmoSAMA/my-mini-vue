import { hasChanged, isObject } from '../shared';
import { isTracking, trackEffects, triggerEffects } from './effect';
import { reactive } from './reactive';

class RefImpl {
  private _value: any;
  private _rawValue: any;
  public dep: Set<any>;
  public __v_isRef = true;

  constructor(value) {
    this._value = convert(value);
    this._rawValue = value;
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // 在比较时proxy和原始对象不相等，所以要保存_rawValue
    // 比如原先 a = ref({foo: 1}), a.value = {foo: 1}
    if (hasChanged(this._rawValue, newValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;
      triggerEffects(this.dep);
    }
  }
}

export function ref(value) {
  return new RefImpl(value);
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get: (target, key) => {
      return unRef(Reflect.get(target, key));
    },
    set: (target, key, value) => {
      if (isRef(target[key]) && !isRef(value)) {
        return (target[key].value = value);
      }
      return Reflect.set(target, key, value);
    }
  });
}
