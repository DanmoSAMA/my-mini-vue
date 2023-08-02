import { effect } from '../reactivity/effect';
import { ShapeFlags } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { Fragment, Text } from './vnode';

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert
  } = options;

  function render(n2, container, parentComponent) {
    patch(null, n2, container, parentComponent);
  }

  function patch(n1, n2, container, parentComponent) {
    const { type } = n2;

    switch (type) {
      case Fragment:
        mountChildren(n2, container, parentComponent);
        break;
      case Text:
        processText(n2, container);
        break;
      default:
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n2, container, parentComponent);
        }
    }
  }

  function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processElement(n1, n2, container, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function mountElement(vnode, container, parentComponent) {
    const { type, props, children } = vnode;

    // 设置element类型的vnode
    const el = (vnode.el = hostCreateElement(type));

    for (const key in props) {
      const value = props[key];
      hostPatchProp(el, key, value);
    }

    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode, el, parentComponent);
    }

    hostInsert(el, container);
  }

  function patchElement(n1, n2, container) {
    console.log(n1);
    console.log(n2);
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent);
    });
  }

  function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
  }

  function mountComponent(initialVNode, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    effect(() => {
      const { proxy, isMounted } = instance;

      if (!isMounted) {
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance);

        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const subTree = instance.render.call(proxy); // 新的vnode
        patch(instance.subTree, subTree, container, instance);
        instance.subTree = subTree;
      }
    });
  }

  return {
    createApp: createAppAPI(render)
  };
}
