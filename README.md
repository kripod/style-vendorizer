# style-vendorizer

Tiny CSS vendor prefixer and property alias mapper for runtime styling solutions.

[![npm](https://img.shields.io/npm/v/style-vendorizer)](https://www.npmjs.com/package/style-vendorizer)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/style-vendorizer)](https://bundlephobia.com/package/style-vendorizer)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/kripod/style-vendorizer/CI/main)](https://github.com/kripod/style-vendorizer/actions/workflows/ci.yaml)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

## Usage

Install the library with a package manager, e.g. npm:

```shell
npm install style-vendorizer
```

After that, import transformer functions on demand. A recommended starting point is shown below:

```js
import {
  cssPropertyAlias,
  cssPropertyPrefixFlags,
  cssValuePrefixFlags,
} from "style-vendorizer";

function styleDeclaration(property, value) {
  let cssText = "";

  /* Resolve aliases, e.g. `gap` -> `grid-gap` */
  const propertyAlias = cssPropertyAlias(property);
  if (propertyAlias) cssText += `${propertyAlias}:${value};`;

  /* Prefix properties, e.g. `backdrop-filter` -> `-webkit-backdrop-filter` */
  const propertyFlags = cssPropertyPrefixFlags(property);
  if (propertyFlags & 0b001) cssText += `-webkit-${property}:${value};`;
  if (propertyFlags & 0b010) cssText += `-moz-${property}:${value};`;
  if (propertyFlags & 0b100) cssText += `-ms-${property}:${value};`;

  /* Prefix values, e.g. `position: "sticky"` -> `position: "-webkit-sticky"` */
  /* Notice that flags don't overlap and property prefixing isn't needed here */
  const valueFlags = cssValuePrefixFlags(property, value);
  if (valueFlags & 0b001) cssText += `${property}:-webkit-${value};`;
  else if (valueFlags & 0b010) cssText += `${property}:-moz-${value};`;
  else if (valueFlags & 0b100) cssText += `${property}:-ms-${value};`;

  /* Include the standardized declaration last */
  /* https://css-tricks.com/ordering-css3-properties/ */
  cssText += `${property}:${value};`;

  return cssText;
}
```

Prefix flags may be defined in TypeScript without any overhead as follows:

<!-- prettier-ignore-start -->

```ts
const enum CSSPrefixFlags {
  "-webkit-" = 1 << 0, // 0b001
     "-moz-" = 1 << 1, // 0b010
      "-ms-" = 1 << 2, // 0b100
}

/* Magic numbers from the previous snippet should be replaced like below: */
if (flags & CSSPrefixFlags["-webkit-"]) cssText += "...";
if (flags & CSSPrefixFlags["-moz-"]) cssText += "...";
if (flags & CSSPrefixFlags["-ms-"]) cssText += "...";
```

<!-- prettier-ignore-end -->

## Browser Support

Every browser in the default [Browserslist](https://github.com/browserslist/browserslist) configuration is supported and tested against:

- Baidu Browser for Android 7.12+
- Chrome 57+
- Edge 16+
- Firefox 48+
- Internet Explorer 11
- KaiOS Browser 2.5+
- Opera 46+
- Safari 12.2+
- Samsung Internet Browser 11.1+
- QQ Browser for Android 10.4+
- UC Browser for Android 12.12+

## Quirks

- Function values are only prefixed for longhand properties. This guarantees that only the start of each value is compared, for efficiency:

  ```js
  // Prints "1 0"
  console.log(
    cssPropertyPrefixFlags(
      "background-image", // Longhand
      "image-set('example.png' 1x, 'example-2x.png' 2x)", // Prefixed
    ),
    cssPropertyPrefixFlags(
      "background", // Shorthand
      "image-set('example.png' 1x, 'example-2x.png' 2x)", // Not prefixed
    ),
  );
  ```

- CSS Grid works in IE 11 only when using the following longhand properties:
  - `grid-template-rows`, `grid-template-columns`
  - `grid-row-start`, `grid-column-start`
  - `-ms-grid-row-span` and `-ms-grid-column-span` (along with `grid-row-end` and `grid-column-end` for cross-browser compatibility)
  - `align-self`, `justify-self`
- `cross-fade()` and `element()` functions are not prefixed, due to the lack of standard implementations.
- Selectors are not yet supported.

## Acknowledgements

This project was heavily inspired by [tiny-css-prefixer](https://github.com/kitten/tiny-css-prefixer). Test vectors are obtained from [@mdn/browser-compat-data](https://github.com/mdn/browser-compat-data).
