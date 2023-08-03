import { effect } from '../reactivity/effect';
import { EMPTY_OBJ } from '../shared';
import { ShapeFlags } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { Fragment, Text } from './vnode';

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText
  } = options;

  function render(n2, container, parentComponent) {
    patch(null, n2, container, parentComponent);
  }

  function patch(n1, n2, container, parentComponent) {
    const { type } = n2;

    switch (type) {
      case Fragment:
        mountChildren(n2.children, container, parentComponent);
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
      patchElement(n1, n2, container, parentComponent);
    }
  }

  function mountElement(vnode, container, parentComponent) {
    const { type, props, children } = vnode;

    // 设置element类型的vnode
    const el = (vnode.el = hostCreateElement(type));

    for (const key in props) {
      const value = props[key];
      hostPatchProp(el, key, null, value);
    }

    if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }

    hostInsert(el, container);
  }

  function patchElement(n1, n2, container, parentComponent) {
    const prevProps = n1.props || EMPTY_OBJ;
    const nextProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchProps(el, prevProps, nextProps);
    patchChildren(n1, n2, el, parentComponent);
  }

  function patchChildren(n1, n2, container, parentComponent) {
    const { shapeFlag: prevShapeFlag, children } = n1;
    const { shapeFlag, children: c2 } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(children);
      }
      hostSetElementText(container, c2);
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '');
        mountChildren(c2, container, parentComponent);
      } else {
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      hostRemove(children[i].el);
    }
  }

  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps[key], newProps[key]);
      }
    }
    if (oldProps !== EMPTY_OBJ) {
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((vnode) => {
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
