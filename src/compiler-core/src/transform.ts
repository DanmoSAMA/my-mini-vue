export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);
}

function createRootCodegen(root) {
  root.codegenNode = root.children[0];
}

function createTransformContext(root, options) {
  return {
    root,
    nodeTransforms: options.nodeTransforms
  };
}

function traverseNode(node, context) {
  const { nodeTransforms } = context;

  if (nodeTransforms) {
    for (const transform of nodeTransforms) {
      transform(node);
    }
  }

  traverseChildren(node, context);
}

function traverseChildren(node, context) {
  const { children } = node;

  if (children) {
    for (const child of children) {
      traverseNode(child, context);
    }
  }
}
