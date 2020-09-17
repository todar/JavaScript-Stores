## JavaScript Stores

A simple library to deal with state using a subscription model.

> This is fully inspired by [svelte stores](https://svelte.dev/tutorial/writable-stores) and is my attempt and replicating them!

### Examples

See writable Store example on [codepen](https://codepen.io/todar/pen/wvKwzNg?editors=0010).

```javascript
// Create a `Writable` store that allows both updating and reading by subscription.
const writable = initialState => {
    let state = initialState;
    let subscriptions = [];

    // ⚡ Update to new state and notify subscribors
    const set = value => {
        if (state === value) return;
        state = value;
        subscriptions.forEach(fn => fn(state));
    };

    // 🍌 => 🍌 + 🍍 Update state using a callback function and inform all subscribers.
    const update = fn => {
        set(fn(state));
    };

    // 🎫 Add subscripiton and immediatly run with the current state.
    const subscribe = run => {
        run(state);
        subscriptions = [...subscriptions, run];
        return () => subscriptions = subscriptions.filter(fn => fn !== run);
    };

    return {set, subscribe, update}
}
```