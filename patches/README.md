# Patches

These patches use [patch-package](https://github.com/ds300/patch-package) to update dependencies which have unpublished
fixes.

## @comapeo/core

### [Do not watch fallback map patch when setting up SMP server plugin](./@comapeo+core+4.0.0+001+fix-smp-fallback-map-setup.patch)

By default, core sets up a file watcher for the `fallbackMapPath` option that's provided when instantiating `MapeoManager`. This does not work when packaging the app as an ASAR file (via Electron Forge) because watching a file within the ASAR directory is not possible. Instead, we change the setup so that it does not try to watch the file and instead make the assumption that the file always exists on instantiation, which is generally the case in CoMapeo Desktop (for now).

## @comapeo/ipc

### [Change imports to avoid calling unavailable code](./@comapeo+ipc+4.0.0+001+fix-client-server-import.patch)

There was an error while running app because of exports in `rpc-reflector` package. To remove this patch, `rpc-reflector` would need to be updated not to use `encode-decode.js` file which indirect usage results in errors.

## rpc-reflector

### [Change imports to avoid calling unavailable code](./rpc-reflector+1.3.11+001+fix-client-duplex.patch)

There was an error while running app because of `duplex` method call in `rpc-reflector` package.
As this feature is not used in CoMapeo, this can be safely hardcoded to `false`. To remove this patch, `rpc-reflector` would need to be updated to account for this bug.

### [Use type imports in types-only file](./rpc-reflector+1.3.11+002+fix-verbatim-module-syntax-issues.patch)

Was running into an issue where TS was complaining about the type of imports being used in the offending files. This is partially fixed with [this commit](https://github.com/digidem/rpc-reflector/commit/e7c1becbc6fa7c9c1345b99ca20fc3331dc756af) (not yet published though) and fully fixed once [this](https://github.com/digidem/rpc-reflector/pull/22) is merged and published.
