import { NodeTypes } from './ast';

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context));
}

function createParserContext(content: string): any {
  return {
    source: content
  };
}

function parseChildren(context) {
  const nodes: any = [];

  let node;
  if (context.source.startsWith('{{')) {
    node = parseInterpolation(context);
  }

  nodes.push(node);

  return nodes;
}

function parseInterpolation(context) {
  // {{ message }}
  //  =>
  // return {
  //   type: NodeTypes.INTERPOLATION,
  //   content: {
  //     type: NodeTypes.SIMPLE_EXPRESSION,
  //     content: 'message'
  //   }
  // };

  const openDelimiter = '{{';
  const closeDelimiter = '}}';

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  // 移除 {{
  advanceBy(context, openDelimiter.length);

  // 移除 }}
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);

  // 边缘case，去掉多余空格
  const content = rawContent.trim();

  // {{ message }} 这部分已经处理完了，后面可能还有字符，继续向前移动
  advanceBy(context, rawContentLength + closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content
    }
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children
  };
}
