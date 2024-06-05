# Web Components
Gluon supports using web components just like any other native element.
```tsx
<some-web-component />
```

To implement a web component, you can extend the `GluonElement` class which takes care of creating a shadow root and renders content when the element is connected to the document:
```tsx
import { GluonElement } from "@mxjp/gluon/element";

class ExampleComponent extends GluonElement {
  render() {
    return <h1>Hello World!</h1>;
  }
}

customElements.define("example-component", ExampleComponent);
```

## Reflecting Attributes
The `reflect` function can be used to get a signal that reflects an attribute value.
```tsx
import { GluonElement } from "@mxjp/gluon/element";

class ExampleCounter extends GluonElement {
  // Allow this component to detect changes to the "count" attribute:
  static observedAttributes = ["count"];

  // Create a signal that reflects the "count" attribute:
  #count = this.reflect("count");

  render() {
    return <button $click={() => {
      const newCount = Number(this.#count) + 1;

      // Updating the signal will also update the "count" attribute:
      this.#count.value = newCount;

      // Dispatch an event to notify users of your web component:
      this.dispatchEvent(new CustomEvent("count-changed", { detail: newCount }));
    }}>
      Clicked {this.#count} times!
    </button>;
  }

  // Optionally, you can implement property accessors:
  get count() {
    return Number(this.#count.value);
  }
  set count(value: number) {
    this.#count.value = String(value);
  }
}

customElements.define("example-counter", ExampleCounter);
```

## Manual Implementation
Due to it's simple lifecycle system, you can also implement web components manually:
```tsx
import { mount, capture, teardown, TeardownHook } from "@mxjp/gluon";

class ExampleComponent extends HTMLElement {
  #dispose?: TeardownHook;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.#dispose = capture(() => {
      // Create and append content to the shadow root:
      const view = mount(
        this.shadowRoot,
        <h1>Hello World!</h1>,
      );

      // Remove content from the shadow root when disposed:
      teardown(() => view.detach());
    });
  }

  disconnectedCallback() {
    // Run teardown hooks:
    this.#dispose?.();
    this.#dispose = undefined;
  }
}
```
