import { h } from '../../lib/guide-mini-vue.esm.js';

export const Foo = {
  setup(props, { emit }) {
    emit('add', 1, 2);
    emit('some-event');
  },
  render() {
    return h('div', {}, 'foo: ' + this.count);
  }
};
