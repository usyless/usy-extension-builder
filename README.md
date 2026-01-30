# extension-builder
A basic extension builder for my extensions

Add to `package.json`:
```json
{
  "devDependencies": {
    "usy-extension-builder": "github:/usyless/usy-extension-builder.git#main"
  },
  "scripts": {
    "build": "usy-extension-builder-build",
    "swap-manifests": "usy-extension-builder-swap-manifests"
  }
}
```
Then run using your scripts