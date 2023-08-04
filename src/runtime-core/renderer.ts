import { effect } from '../reactivity/effect';
import { EMPTY_OBJ } from '../shared';
import { ShapeFlags } from '../shared/ShapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { shouldComponentUpdate } from './componentUpdateUtils';
import { createAppAPI } from './createApp';
import { queueJobs } from './scheduler';
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
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n2, container);
        break;
      default:
        if (n2.shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (n2.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
    }
  }

  function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    console.log('patchElement');
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
        mountChildren(c2, container, parentComponent);
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
      let s1 = i;
      let s2 = i;
      let patched = 0;
      let moved = false;
      let maxIndexSoFar = 0;
      const toBePatched = e2 - s2 + 1;
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = Array(toBePatched).fill(0);

      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }
      for (let i = s1; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        // 原数组的元素 在新数组中的下标
        let newIndex;

        if (prevChild.key !== null && prevChild.key !== undefined) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (newIndex === undefined) {
          hostRemove(prevChild.el);
        } else {
          // 原数组的元素 在新数组中的下标 构成的数组 应该是递增的 CDE -> CDE [0, 1, 2]
          // 如果不是递增的，说明需要移动，设置moved   CDE -> ECD [1, 2, 0]
          if (newIndex > maxIndexSoFar) {
            maxIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
        }
      }
      // 位于最长递增子序列下标的结点，无需移动
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      // 指向最长递增子序列的末尾，指针向左移动
      let j = increasingNewIndexSequence.length - 1;

      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex < l2 ? c2[nextIndex + 1].el : null;

        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        } else if (moved) {
          // j < 0 说明已经遍历完了最长递增子序列，剩下的结点全都是要移动的
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, container, anchor);
          }
        }
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
      mountChildren(children, el, parentComponent);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((vnode) => {
      patch(null, vnode, container, parentComponent, null);
    });
  }

  function processComponent(n1, n2, container, parentComponent) {
    if (!n1) {
      mountComponent(n2, container, parentComponent);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    // 调用render，生成新的element vnode，再进行patch

    const instance = (n2.component = n1.component);
    if (shouldComponentUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      // 无需更新，因此el也不会再改变，直接赋值给n2
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function mountComponent(initialVNode, container, parentComponent) {
    // 为了实现组件更新，在vnode上保存instance
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance: any, initialVNode, container) {
    instance.update = effect(
      () => {
        const { proxy, isMounted } = instance;

        if (!isMounted) {
          const subTree = (instance.subTree = instance.render.call(proxy));
          patch(null, subTree, container, instance, null);

          initialVNode.el = subTree.el;
          instance.isMounted = true;
        } else {
          const { next } = instance;

          if (next) {
            updateComponentPreRender(instance, next);
          }

          const subTree = instance.render.call(proxy); // 新的element vnode
          patch(instance.subTree, subTree, container, instance, null);
          instance.subTree = subTree;
        }
      },
      {
        scheduler: () => {
          console.log('update - scheduler');
          queueJobs(instance.update);
        }
      }
    );
  }

  return {
    createApp: createAppAPI(render)
  };
}

function updateComponentPreRender(instance, nextVNode) {
  instance.props = nextVNode.props;
  instance.next = null;
  instance.vnode = nextVNode;
}

function getSequence(arr) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
