const publicPropertiesMap = {
  // 从component类型的vnode获取el
  $el: (i) => i.vnode.el
};

export const PublicInstanceProxyHandlers = {
  // 把对象的_解构成instance变量
  get({ _: instance }, key) {
    const { setupState } = instance;
    if (key in setupState) {
      return setupState[key];
    }

    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter(instance);
    }
  }
};
