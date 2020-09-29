## JavaScript Stores

A simple library to deal with state using a subscription model.

> This is fully inspired by [svelte stores](https://svelte.dev/tutorial/writable-stores) and is my attempt and replicating them!

### Examples

#### Writable Store 

> example on [codepen](https://codepen.io/todar/pen/wvKwzNg?editors=0010).

```javascript
// Create a `Writable` store that allows both updating and reading by subscription.
const writable = (initialState, onFirstSubscription = null) => {
    let state = initialState;
    let subscriptions = [];
    let onLastUnsubsribe = null;

    // ⚡ Update to new state and notify subscribers.
    const set = value => {
        if (state === value) return;
        state = value;
        subscriptions.forEach(fn => fn(state));
    };

    // 🍌 => 🍌 + 🍍 Update state using a callback function and notify all subscribers.
    const update = fn => {
        set(fn(state));
    };

    // 🎫 Add subscripiton and immediatly run with the current state.
    const subscribe = run => {
        subscriptions = [...subscriptions, run];
        
        // Pass `Set` for readonly stores to update the state.
        if (subscriptions.length === 1 && onFirstSubscription) 
           onLastUnsubsribe = onFirstSubscription(set) || null;
      
        // Run the subscription callback, passing in the state.
        run(state);
        
        // return the unsubscribe function 
        return () =>{
          subscriptions = subscriptions.filter(fn => fn !== run);
          
          // No more subscribers, run cleanup to make sure no longer
          // setting state in readonly stores.
          if (subscriptions.length === 0) {
            onLastUnsubsribe && onLastUnsubsribe();
            onLastUnsubsribe = null;
          }
        };
    };

    return {set, subscribe, update}
}
```

#### Readable Store

```javascript
// Create a `Readable` store that only allows reading by subscription.
export const readable = (initialValue, onFirstSubscription) =>  ({
    subscribe: writable(initialValue, onFirstSubscription).subscribe
})
```

State in `readable` stores are handled by the callback function `onFirstSubscription` and will be passed the `Set` function from the `writable` store.

```javascript
// Example of Readable store
const time = readable(new Date(), function onFirstSubscription(set) {

  const interval = setInterval(() => {
    set(new Date());
  }, 1000);

  return function onLastUnsubsribe() {
    clearInterval(interval);
  };
});
```

#### Derived Store

```javascript
// Derive a store from one or more other store values.
const derived = (stores, fn, initial_value) => {
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
```

```javascript
// Example of derived store using the time store above...
const start = new Date();
const elapsed = derived(
  time,
  $time => Math.round(($time - start) / 1000)
);

// Display the elapsed time.
elapsed.subscribe($time => `The page has been opened ${$time} ${$time === 1 ? 'second' : 'seconds'}`)

// More examples of derived stores.
const a = writable(2)
const b = writable(10)

// Single Subscription
const doubled = derived(a, $a => $a * 2);

// Single Subscription - Asyncronous
const delayedDoubled = derived(a, ($a, set) => {
  setTimeout(() => set($a), 1000);
}, 'one moment...');

// Multiple subscriptions
const summed = derived([a, b], ([$a, $b]) => $a + $b);

// Multiple subscriptions - Asyncronous
const delayedSummed = derived([a, b], ([$a, $b], set) => {
  setTimeout(() => set($a + $b), 1000);
}, 'one moment...');
```