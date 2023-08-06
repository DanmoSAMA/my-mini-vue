import { NodeTypes } from './ast';
import { TO_DISPLAY_STRING } from './runtimeHelpers';

export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);

  root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root) {
  root.codegenNode = root.children[0];
}

function createTransformContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms,
    helpers: new Map(),
    helper(key) {
      // 在codegen中，用于生成最开始的引入语句
      context.helpers.set(key, 1);
    }
  };
  return context;
}

function traverseNode(node, context) {
  const { nodeTransforms } = context;
  const exitFns: any = [];

  if (nodeTransforms) {
    for (const transform of nodeTransforms) {
      const onExit = transform(node, context);
      if (onExit) {
        exitFns.push(onExit);
      }
    }
  }

  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;
    default:
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(node, context) {
  const { children } = node;

  for (const child of children) {
    traverseNode(child, context);
  }
}
