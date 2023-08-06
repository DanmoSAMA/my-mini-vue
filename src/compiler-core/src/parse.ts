import { NodeTypes } from './ast';

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context, []));
}

function createParserContext(content: string): any {
  return {
    source: content
  };
}

// ancestors是栈
function parseChildren(context, ancestors) {
  const nodes: any = [];

  let node;

  while (!isEnd(context, ancestors)) {
    const s = context.source;
    if (s.startsWith('{{')) {
      node = parseInterpolation(context);
    } else if (/^<[a-z]+>/i.test(s)) {
      node = parseElement(context, ancestors);
    } else {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  const s = context.source;
  const parentTag = ancestors.at(-1);

  if (s.startsWith(`</`)) {
    if (parentTag) {
      if (s.startsWith(`</${parentTag}>`)) {
        ancestors.pop();
        return true;
      } else {
        // <div><span></div>
        throw new Error(`缺少结束标签:${parentTag}`);
        // <div></span></div>
        // 虽然本意是让span缺少开始标签，这种情况也可以认为是div缺少结束标签
      }
    } else {
      // </div>
      const endIndex = s.indexOf('>');
      throw new Error(`缺少开始标签:${s.slice(2, endIndex)}`);
    }
  }

  return !s;
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

  const rawContentLength = closeIndex - openDelimiter.length;

  // 提取中间的content，并且移除
  const rawContent = parseTextData(context, rawContentLength);

  // edge case：去掉多余空格
  const content = rawContent.trim();

  // 移除 }}
  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content
    }
  };
}

function parseElement(context, ancestors) {
  // <div></div>
  //  =>
  // return {
  //   type: NodeTypes.ELEMENT,
  //   tag: 'div'
  // };

  const element: any = parseTag(context, TagType.Start);
  // 处理tag中间的children
  ancestors.push(element.tag);
  element.children = parseChildren(context, ancestors);

  parseTag(context, TagType.End);
  return element;
}

function parseTag(context, type: TagType) {
  const match: any = /^<\/?([a-z]*)>/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);

  if (type === TagType.End) return;

  return {
    type: NodeTypes.ELEMENT,
    tag
  };
}

function parseText(context) {
  // some text
  // =>
  // return {
  //   type: NodeTypes.TEXT,
  //   content: 'some text'
  // };
  const s = context.source;
  const endTokens = ['<', '{{'];
  let endIndex = s.length;

  for (const token of endTokens) {
    const index = s.indexOf(token);
    if (index !== -1 && index < endIndex) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content: content
  };
}

// 封装：提取 + 移除
function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children
  };
}
