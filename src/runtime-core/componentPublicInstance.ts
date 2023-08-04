import { hasOwn } from '../shared/index';

const publicPropertiesMap = {
  // 从component类型的vnode获取el
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props
};

export const PublicInstanceProxyHandlers = {
  // 把对象的_解构成instance变量
  get({ _: instance }, key) {
    const { setupState, props } = instance;

    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter(instance);
    }
  }
};
