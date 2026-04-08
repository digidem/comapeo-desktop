# Patches

These patches use [patch-package](https://github.com/ds300/patch-package) to update dependencies which have unpublished
fixes.

## @comapeo/core

### [Do not watch fallback map patch when setting up SMP server plugin](./@comapeo+core+5.5.0+001+fix-smp-fallback-map-setup.patch)

By default, core sets up a file watcher for the `fallbackMapPath` option that's provided when instantiating `MapeoManager`. This does not work when packaging the app as an ASAR file (via Electron Forge) because watching a file within the ASAR directory is not possible. Instead, we change the setup so that it does not try to watch the file and instead make the assumption that the file always exists on instantiation, which is generally the case in CoMapeo Desktop (for now).

## @comapeo/ipc

### [Expose map server's `getPorts()` method in app rpc](./@comapeo+ipc+8.0.0+001+expose-map-server-get-ports-method.patch)

Makes `mapServer.getPorts()` method implemented in the [`@comapeo/map-server` patch](./@comapeo+map-server+1.1.0+002+expose-get-ports-method.patch) available to the app RPC client (mostly from a types perspective).

## @comapeo/map-server

### [Fix CORS headers for PUT methods](./@comapeo+map-server+1.1.0+001+fix-put-cors-error.patch)

Most likely only an issue in development, but when performing any PUT operations (e.g. uploading a custom map), it fails due to a CORS error.

### [Expose `getPorts()` method in `createServer()` return](./@comapeo+map-server+1.1.0+002+expose-get-ports-method.patch)

Related to https://github.com/digidem/comapeo-map-server/issues/43. We want to start the map server in the backend (without hardcoding ports). In order for the client-side to get information about the local port being used, we expose a `getPort()` method on the return value of `createServer()`, which gets forwarded as part of the RPC API exposed via `@comapeo/ipc` (see [patch](./@comapeo+ipc+8.0.0+001+expose-map-server-get-ports-method.patch)).
