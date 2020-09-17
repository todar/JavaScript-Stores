import {
  writable,
} from "../src/store.js";

test(`subscription returns the current state`, () => {
  const state = 2;
  writable(state).subscribe((num) => expect(num).toEqual(state))();
});

test(`update returns the current state`, () => {
  const state = 2;
  writable(state).update((num) => {
    expect(num).toEqual(state);
    return num;
  });
});

test(`subscriptions are not notified if the new state is the same as the original`, () => {
  const state = 2;
  const count = writable(state);

  const mock = jest.fn();
  const unsubscribe = count.subscribe(mock);

  count.set(state);
  count.update(num => num)
  expect(mock).toHaveBeenCalledTimes(1);

  unsubscribe()
})

test(`set and update both trigger subscription calls on new values`, () => {
  const count = writable(0);
  let local;
  const unsubscribe = count.subscribe(num => local = num);

  const actual = 4;
  count.set(actual);
  expect(local).toBe(actual);

  count.update(num => num * 2)
  expect(local).toBe(actual * 2)

  unsubscribe()
})

test(`subscriptions are able to unsubscribe`, () => {
  const count = writable(0);
  const mock = jest.fn();
  const unsubscribe = count.subscribe(mock);

  expect(typeof unsubscribe).toBe('function')
  unsubscribe();
  count.set(10);
  expect(mock).toBeCalledTimes(1)
})