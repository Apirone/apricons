![ApironeIcons Logo](https://apirone.com/img/logos/logo-primary.svg "ApironeLogo")

---

[![GitHub license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](https://raw.githubusercontent.com/Apirone/apirone-icons/main/LICENSE)

This library contains Apirone branded icons as an icon font.

---

### Requirements

The package is published to **GitHub Packages**, not the public npm registry.
You need a GitHub personal access token with `read:packages` scope.

Add to your project's `.npmrc`:

```
@apirone:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

### Install

```bash
npm install @apirone/apricons
```

### Import

```js
import '@apirone/apricons/style.css'
```

### Example

```html
<i class="apr apr-box"></i>
```

### Build locally

```bash
yarn install
yarn build
```

---

## License

This project is licensed under the terms of the
[MIT license](LICENSE).
