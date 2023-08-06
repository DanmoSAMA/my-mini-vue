import { NodeTypes } from '../ast';
import { isText } from '../utils';

export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const { children } = node;
      let currentContainer;

      for (let i = 0; i < children.length; i++) {
        const prevChild = children[i];
        if (isText(prevChild)) {
          for (let j = i + 1; j < children.length; j++) {
            const nextChild = children[j];
            // 把相邻的文本类结点变为合成结点，因为文本之间有" + "
            // codegen不好处理，必须让transform来
            if (isText(nextChild)) {
              if (!currentContainer) {
                // 要给children[i]赋值
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  children: [prevChild]
                };
              }
              currentContainer.children.push(' + ');
              currentContainer.children.push(nextChild);
              children.splice(j--, 1);
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}
