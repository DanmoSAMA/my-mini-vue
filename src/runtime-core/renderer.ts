import { effect } from '../reactivity/effect';
import { EMPTY_OBJ } from '../shared';
import { ShapeFlags } from '../shared/ShapeFlags';
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

  function render(vnode, container) {
    patch(null, vnode, container, null, null);
  }

  function patch(n1, n2, container, parentComponent, anchor) {
    const { type } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n2, container);
        break;
      default:
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n2, container, parentComponent, anchor);
        }
    }
  }

  function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    const prevProps = n1.props || EMPTY_OBJ;
    const nextProps = n2.props || EMPTY_OBJ;

    const el = (n2.el = n1.el);

    patchProps(el, prevProps, nextProps);
    patchChildren(n1, n2, el, parentComponent, anchor);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, '');
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    const l1 = c1.length;
    const l2 = c2.length;

    let e1 = l1 - 1;
    let e2 = l2 - 1;
    let i = 0;

    function isSameVNodeType(n1, n2) {
      // vnode上保存了props.key
      return n1.type === n2.type && n1.key === n2.key;
    }

    // 左侧相同
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }

    // 右侧相同
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // 新的比旧的长 - 左侧或右侧需要添加，添加区间是[i, e2]，锚点是 e2+1 / null
    // e1 < i <= e2 说明需要添加，把添加到左侧和右侧的逻辑合并了
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        // 如果nextPos === l2，说明新结点插入点在最后
        // AB -> DCAB，n2 === 1, nextPos === 2, anchor === A，始终保持不变
        // 先在A之前插入D，然后还是在A之前插入C
        const anchor = nextPos < l2 ? c2[nextPos].el : null;

        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    }
    // 新的比旧的短 - 左侧或右侧需要删除，删除区间是[i, e1]
    else if (i > e2) {
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    }
    // 中间部分
    else {
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

  function mountElement(vnode, container, parentComponent, anchor) {
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
      mountChildren(children, el, parentComponent, anchor);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent, anchor);
    });
  }

  function processComponent(vnode, container, parentComponent, anchor) {
    mountComponent(vnode, container, parentComponent, anchor);
  }

  function mountComponent(initialVNode, container, parentComponent, anchor) {
    const instance = createComponentInstance(initialVNode, parentComponent);

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container, anchor);
  }

  function setupRenderEffect(instance: any, initialVNode, container, anchor) {
    effect(() => {
      const { proxy, isMounted } = instance;

      if (!isMounted) {
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance, anchor);

        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const subTree = instance.render.call(proxy); // 新的vnode
        patch(instance.subTree, subTree, container, instance, anchor);
        instance.subTree = subTree;
      }
    });
  }

  return {
    createApp: createAppAPI(render)
  };
}
