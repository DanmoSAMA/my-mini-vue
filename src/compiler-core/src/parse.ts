import { NodeTypes } from './ast';

const enum TagType {
  Start,
  End
}

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
  const s = context.source;

  let node;

  if (s.startsWith('{{')) {
    node = parseInterpolation(context);
  } else if (s[0] === '<') {
    if (/[a-z]/i.test(s[1])) {
      node = parseElement(context);
    }
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

function parseElement(context) {
  // <div></div>
  //  =>
  // return {
  //   type: NodeTypes.ELEMENT,
  //   tag: 'div'
  // };

  const element = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  return element;
}

function parseTag(context, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag
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
