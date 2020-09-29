/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * This is fully inspired by svelte stores @see https://svelte.dev/tutorial/writable-stores
 * and is my attempt and replicating it.
 *
 * @author Robert Todar <robert@roberttodar.com>
 * @template T A generic type that will be the first intial state.
 * @param {T} initialState The starting state of the store.
 * @param {Function} onFirstSubscription Readonly function for managing state.
 */
export const writable = (initialState, onFirstSubscription = null) => {
  let state = initialState;
  let subscriptions = [];
  let onLastUnsubsribe = null;

  /**
   * Add subscripiton and inform with state
   * @param {Function} run A callback function where the current state will be passed.
   * @returns {Function} A Function to unsubscribe to the store.
   * @example const unsubscribe = store.subscribe(n => console.log(n));
   */
  const subscribe = run => {
    subscriptions = [...subscriptions, run];

    // Pass `Set` for readonly stores to update the state.
    if (subscriptions.length === 1 && onFirstSubscription) {
      onLastUnsubsribe = onFirstSubscription(set) || null;
    }

    // Run the subscription callback, passing in the state.
    run(state);

    return () => {
      subscriptions = subscriptions.filter((fn) => fn !== run);
      // No more subscribers, run cleanup to make sure no longer
      // setting state in readonly stores.
      if (subscriptions.length === 0) {
        onLastUnsubsribe && onLastUnsubsribe();
        onLastUnsubsribe = null;
      }
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

  return {set,update,subscribe};
};

// Create a `Readable` store that only allows reading by subscription.
export const readable = (initialValue, onFirstSubscription) =>  ({
  subscribe: writable(initialValue, onFirstSubscription).subscribe
})

// Derive a store from one or more other store values.
export const derived = (stores, fn, initial_value) => {
  const single = !Array.isArray(stores);
  const stores_array = single
      ? [stores]
      : stores;

  // If there are 2 arguments in the callback function 
  // then it means `Set` is being used manualy.
  // Otherwise, the value is simply being returned and will need to be `Set`.
  const valueIsReturned = fn.length < 2;

  // Derived is a readable store... Nice!
  return readable(initial_value, set => {
      let inited = false;
      const values = [];
      let cleanup = null;

      const sync = () => {
          // ♻ If there is a cleanup this will run on each update before
          // the next function call... This is optional and will only be called 
          // if returned by the function...
          cleanup && cleanup();

          const result = fn(single ? values[0] : values, set);

          if (valueIsReturned) {
              // ⚡ Result is the value, must `Set` it.
              set(result);
          } else {
              // `Set` is manualy used within the function itself, no need to `Set` here.
              // ♻ Instead, check to see if a cleanup was returned and if so,
              // ♻ capture it for the next call.
              cleanup = typeof result === 'function' ? result : null;
          }
      };

      // 🏪 Subscribe to each store.
      const unsubscribers = stores_array.map((store, index) => store.subscribe( value => {
          // Store value from store into the array of values.
          // Collect values before getting the computed value of this store.
          values[index] = value;

          // If this has run once already then sync this dirived value from the other stores.
          inited && sync();
        }
      ));
      
      // On first run setup inited and run sync.
      inited = true;
      sync();
      
      // Return a unsubscribe all function, to stop listening to other stores.
      return function stop() {
        unsubscribers.forEach(unsubscribe => unsubscribe());

        // ♻ If there is a cleanup function then run it.
        cleanup && cleanup();
      };
  });
}