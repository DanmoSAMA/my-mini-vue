const targetMap = new Map();
let activeEffect;
let shouldTrack = false;

type effectOptions = {
  scheduler?: Function;
  onStop?: Function;
};

class ReactiveEffect {
  private _fn: Function;
  public scheduler: Function | undefined;
  deps = [];
  active = true;
  onStop: Function | undefined;

  constructor(fn, scheduler?, onStop?) {
    this._fn = fn;
    this.scheduler = scheduler;
    this.onStop = onStop;
  }
  run() {
    if (!this.active) {
      return this._fn();
    }

    activeEffect = this;
    // 在执行回调前，先设置shouldTrack
    // 确保本次回调执行的过程中，如果访问了响应式对象的属性，依然能够track
    shouldTrack = true;
    const res = this._fn();
    // 回调执行完毕，重置shouldTrack
    shouldTrack = false;

    return res;
  }
  stop() {
    if (this.active) {
      cleanEffect(this);
      if (this.onStop) {
        this.onStop();
      }
    }
    this.active = false;
  }
}

function cleanEffect(effect) {
  effect.deps.forEach((dep: Set<ReactiveEffect>) => {
    dep.delete(effect);
  });
  effect.deps.length = 0;
}

export function effect(fn, options: effectOptions = {}) {
  const { scheduler, onStop } = options;
  const _effect = new ReactiveEffect(fn, scheduler, onStop);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function track(target, key) {
  if (!isTracking()) return;

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

  trackEffects(dep);
}

export function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }

  activeEffect.deps.push(dep);
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target);
  const dep = depsMap.get(key);
  triggerEffects(dep);
}

export function triggerEffects(dep) {
  dep.forEach((effect) => {
    if (!effect.scheduler) {
      effect.run();
    } else {
      effect.scheduler();
    }
  });
}

export function stop(runner) {
  runner.effect.stop();
}
