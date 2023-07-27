import { isReadonly, readonly } from '../reactive';

describe('readonly', () => {
  it('happy path', () => {
    const user = { age: 10 };
    const readonlyUser = readonly(user);
    expect(readonlyUser).not.toBe(user);
    expect(readonlyUser.age).toBe(10);

    expect(isReadonly(user)).toBe(false);
    expect(isReadonly(readonlyUser)).toBe(true);
  });

  it('should call console.warn when set', () => {
    console.warn = jest.fn();
    const user = { age: 10 };
    const readonlyUser = readonly(user);

    readonlyUser.age++;
    expect(console.warn).toHaveBeenCalled();
  });
});
