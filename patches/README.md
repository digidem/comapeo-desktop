# Patches

These patches use [patch-package](https://github.com/ds300/patch-package) to update dependencies which have unpublished
fixes.

## @comapeo/ipc

### [Change imports to avoid calling unavailable code](./@comapeo+ipc+2.0.2+001+fix-client-server-import.patch)

There was an error while running app via Expo because of exports in `rpc-reflector` package. To remove this patch, `rpc-reflector` would need to be updated not to use `encode-decode.js` file which indirect usage results in errors.

## rpc-reflector

### [Change imports to avoid calling unavailable code](./rpc-reflector+1.3.11+001+fix-client-duplex.patch)

There was an error while running app via Expo because of `duplex` method call in `rpc-reflector` package.
As this feature is not used in CoMapeo, this can be safely hardcoded to `false`. To remove this patch, `rpc-reflector` would need to be updated to account for this bug.
