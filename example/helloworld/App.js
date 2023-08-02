import { createTextVNode, h } from '../../lib/my-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  render() {
    const app = h('div', {}, 'hi, ' + this.msg);
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => h('div', {}, 'header ' + age),
        footer: () => h('div', {}, 'footer')
      }
      // [h('p', {}, 'slot test1'), h('p', {}, 'slot test2')]
    );
    // const bar = h('div', {}, ['str1', 'str2', 'str3']);
    const bar = h('div', {}, [h('p', {}, 'test'), createTextVNode('text结点')]);
    return h(
      'div',
      {
        id: 'root'
      },
      [app, foo, bar]
    );
  },

  setup() {
    return {
      msg: 'mini-vue'
    };
  }
};
