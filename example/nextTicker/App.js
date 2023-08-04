import {
  h,
  ref,
  getCurrentInstance,
  nextTick
} from '../../lib/my-mini-vue.esm.js';

export default {
  name: 'App',
  setup() {
    const count = ref(1);
    const instance = getCurrentInstance();

    async function onClick() {
      nextTick(() => {
        console.log(instance.vnode.el.querySelector('p').innerText);
      });

      for (let i = 0; i < 100; i++) {
        console.log('update');
        count.value = i;
      }

      console.log(instance.vnode.el.querySelector('p').innerText);

      nextTick(() => {
        console.log(instance.vnode.el.querySelector('p').innerText);
      });

      await nextTick();
      console.log(instance.vnode.el.querySelector('p').innerText);
    }

    return {
      onClick,
      count
    };
  },
  render() {
    const button = h('button', { onClick: this.onClick }, 'update');
    const p = h('p', {}, 'count:' + this.count);

    return h('div', {}, [button, p]);
  }
};
