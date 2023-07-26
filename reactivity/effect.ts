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
    activeEffect = this;
    return this._fn();
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
}

type effectOptions = {
  scheduler?: Function;
  onStop?: Function;
};

let activeEffect;
export function effect(fn, options: effectOptions = {}) {
  const { scheduler, onStop } = options;
  const _effect = new ReactiveEffect(fn, scheduler, onStop);
  _effect.run();
  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
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

  if (!activeEffect) return;

  activeEffect.deps.push(dep);
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

export function stop(runner) {
  runner.effect.stop();
}
