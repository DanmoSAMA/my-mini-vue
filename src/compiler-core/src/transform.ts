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
      context.helpers.set(key, 1);
    }
  };
  return context;
}

function traverseNode(node, context) {
  const { nodeTransforms } = context;

  if (nodeTransforms) {
    for (const transform of nodeTransforms) {
      transform(node);
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
}

function traverseChildren(node, context) {
  const { children } = node;

  for (const child of children) {
    traverseNode(child, context);
  }
}
