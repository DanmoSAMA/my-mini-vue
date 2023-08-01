import { h } from '../../lib/guide-mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {
  render() {
    window.self = this;
    return h(
      'div',
      {
        id: 'root',
        class: 'red',
        onClick: () => console.log('onclick'),
        onMousedown: () => console.log('onmousedown')
      },
      [
        h('div', {}, 'hi,' + this.msg),
        h(Foo, {
          count: 1,
          add: (a, b) => {
            console.log('add', a, b);
          },
          someEvent: () => {
            console.log('some event');
          }
        })
      ]
    );
  },

  setup() {
    return {
      msg: 'mini-vue'
    };
  }
};
