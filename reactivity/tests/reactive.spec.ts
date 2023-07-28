import { isProxy, isReactive, reactive } from '../reactive';

describe('reactive', () => {
  it('happy path', () => {
    const user = { age: 10 };
    const reactiveUser = reactive(user);
    expect(reactiveUser).not.toBe(user);
    expect(reactiveUser.age).toBe(10);

    expect(isReactive(user)).toBe(false);
    expect(isReactive(reactiveUser)).toBe(true);
    expect(isProxy(reactiveUser)).toBe(true);
  });

  test('nested reactives', () => {
    const original = {
      nested: {
        foo: 1
      },
      array: [{ bar: 2 }]
    };
    const observed = reactive(original);
    // 支持嵌套
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
