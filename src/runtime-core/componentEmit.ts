import { camelize } from '../shared/index';

export function emit(instance, event, ...args) {
  const { props } = instance;

  const handler = props[camelize(event)];
  handler && handler(...args);
}
