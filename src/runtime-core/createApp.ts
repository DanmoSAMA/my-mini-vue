import { render } from './renderer';
import { createVNode } from './vnode';

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      const vnode = createVNode(rootComponent);
      console.log(vnode);
      render(vnode, rootContainer);
    }
  };
}
