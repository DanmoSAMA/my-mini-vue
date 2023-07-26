import { effect } from '../effect';
import { reactive } from '../reactive';

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({ age: 10 });
    let nextAge;

    effect(() => {
      nextAge = user.age + 1;
      console.log(nextAge);
    });

    expect(nextAge).toBe(11);
    user.age++;
    expect(nextAge).toBe(12);
  });

  it('should return runner when call effect', () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return foo + 10;
    });
    expect(foo).toBe(11);
    const returnValue = runner();
    expect(foo).toBe(12);
    expect(returnValue).toBe(22);
  });
});
