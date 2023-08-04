export function shouldComponentUpdate(prevVNode, nextVNode) {
  const { props: prevProps } = prevVNode;
  const { props: nextProps } = nextVNode;

  for (const key in prevProps) {
    if (prevProps[key] !== nextProps[key]) {
      return true;
    }
  }
  return false;
}
