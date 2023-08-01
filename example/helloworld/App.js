import { h } from '../../lib/my-mini-vue.esm.js';
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
    return h(
      'div',
      {
        id: 'root'
      },
      [app, foo]
    );
  },

  setup() {
    return {
      msg: 'mini-vue'
    };
  }
};
