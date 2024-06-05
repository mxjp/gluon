---
order: 1
---

# Security
As with any other rendering library, there are several ways to introduce severe security vulnerabilities into a gluon based application by directly allowing user input in specific places.

Assuming that `userInput` is arbitrary user input, the examples below can lead to **severe security vulnerabilities**:
```tsx
// The "prop:innerHTML" attribute can be used to directly render HTML:
<div prop:innerHTML={userInput} />;
<div prop:innerHTML={"<script>alert(location.origin)</script>"} />;

// Any native event attributes can be used to run javascript when dispatched:
<div onclick={userInput} />;
<div onclick="alert(location.origin)" />;

// Because of the above, user controlled attribute names are at least problematic:
<div {...{ [userInput]: somethingElse }} />;
<div {...{ ["prop:innerHTML"]: "<script>alert(location.origin)</script>" }} />;
```
In summary, you should **never** use arbitrary user input as:
+ `prop:innerHTML` attribute value
+ `on...` attribute value
+ attribute name

In contrast, user input used in other attributes and as content is perfectly fine as shown in the example below:
```tsx
import { mount } from "@mxjp/gluon";

mount(
  document.body,
  <div title="alert(location.origin)">
    {"<script>alert(location.origin)</script>"}
  </div>
);
```
