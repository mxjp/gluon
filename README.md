![](./docs/assets/banner.svg)

# Gluon
This is a signal based frontend framework.

```jsx
import { mount, sig } from "@mxjp/gluon";

const count = sig(0);

mount(
  document.body,
  <button $click={() => { count.value++ }}>
    Clicked {count} times
  </button>
);
```

## [Documentation](https://mxjp.github.io/gluon/)
