class ReactiveEffect {
  private _fn: Function;
  public scheduler: Function | undefined;

  constructor(fn, scheduler?) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    activeEffect = this;
    return this._fn();
  }
}

type effectOptions = {
  scheduler?: Function;
};

let activeEffect;
export function effect(fn, options: effectOptions = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  return _effect.run.bind(_effect);
}

const targetMap = new Map();
export function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  dep.add(activeEffect);
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const dep = depsMap.get(key);
  dep.forEach((effect) => {
    if (!effect.scheduler) {
      effect.run();
    } else {
      effect.scheduler();
    }
  });
}
