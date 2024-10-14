# Security
Gluon itself never evaluates code from strings, but as with any other framework, there are many ways to introduce severe security vulnerabilities into gluon based applications by directly using untrusted input in the wrong places.

## Interpolation
Interpolation in rendered content is always safe to use.
```jsx
// This is always safe to use:
<h1>Hello {untrusted}!</h1>;

// Using interpolation in content is equivalent to the following code:
const text = document.createTextNode("");
text.textContent = String(untrusted);
```

Interpolation in attribute values is safe to use as long as the same is true for HTML itself. E.g. an image `alt` attribute is fine, but `href` is not.
```jsx
// The safety of this depends on the attribute ("alt" in this case):
<img alt={untrusted} />;

// Using interpolation in attribute values is equivalent to the following code:
image.setAttribute("alt", String(untrusted));
```

## Common Mistakes
The examples below show some common mistakes and how they could be exploited.
```jsx
// Setting "innerHTML" to untrusted input:
<div innerHTML={untrusted} />;
<div innerHTML="<img src=x onerror=alert(location.origin)>" />;

// Setting any event attributes to untrusted input:
<div onclick={untrusted} />;
<div onclick="alert(location.origin)" />;

// Using untrusted input as attribute name:
<div {...{ [untrusted]: someValue }} />
<div onclick="alert(location.origin)" />;

// Setting any url attribute to untrusted input:
<a href={untrusted}>Click me!</a>
<a href="javascript:alert(location.origin)">Click me!</a>
```

Note, that this is only a small fraction of things that can go wrong.
