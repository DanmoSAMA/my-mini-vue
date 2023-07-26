import { reactive } from '../reactive';

describe('reactive', () => {
  it('happy path', () => {
    const user = { age: 10 };
    const reactiveUser = reactive(user);
    expect(reactiveUser).not.toBe(user);
    expect(reactiveUser.age).toBe(10);
  });
});
