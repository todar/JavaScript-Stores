/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * This is fully inspired by svelte stores @see https://svelte.dev/tutorial/writable-stores
 * and is my attempt and replicating it.
 *
 * @author Robert Todar <robert@roberttodar.com>
 * @template T A generic type that will be the first intial state.
 * @param {T} initialState The starting state of the store.
 */
export const writable = (initialState) => {
  let state = initialState;
  let subscriptions = [];

  /**
   * Add subscripiton and inform with state
   * @param {Function} run A callback function where the current state will be passed.
   * @returns {Function} A Function to unsubscribe to the store.
   * @example const unsubscribe = store.subscribe(n => console.log(n));
   */
  const subscribe = run => {
    subscriptions = [...subscriptions, run];
    run(state);

    return () => {
      subscriptions = subscriptions.filter((fn) => fn !== run);
    };
  }

  /**
   * Set value and inform all subscribers.
   * @param {T} value 
   * @example store.set(0)
   */
  const set = value => {
    if (state === value) return;
    state = value;
    subscriptions.forEach((fn) => fn(state));
  }

  /**
   * Update value using callback function and inform all subscribers.
   * @param {Function} fn function that accepts the current state, and will update based on what is returned.
   * @example store.update(num => num + 1)
   */
  const update = fn => {
    set(fn(state));
  }

  return { set, update, subscribe };
};