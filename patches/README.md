# Patches

These patches use [patch-package](https://github.com/ds300/patch-package) to update dependencies which have unpublished
fixes.

## @comapeo/core

### [Do not watch fallback map patch when setting up SMP server plugin](./@comapeo+core+5.2.1+001+fix-smp-fallback-map-setup.patch)

By default, core sets up a file watcher for the `fallbackMapPath` option that's provided when instantiating `MapeoManager`. This does not work when packaging the app as an ASAR file (via Electron Forge) because watching a file within the ASAR directory is not possible. Instead, we change the setup so that it does not try to watch the file and instead make the assumption that the file always exists on instantiation, which is generally the case in CoMapeo Desktop (for now).

## @tanstack/router-core

### [Define `comapeo:` protocol as safe](./@tanstack+router-core+1.154.8+001+define-custom-protocol-as-safe.patch)

When the router attempts to do a full page reload, it checks the protocol for security purposes. It uses a hardcoded list for known "safe" protocols which results in issues in the app that attempt to navigate to a `comapeo:` URL with `reloadDocument: true` set. This patch updates the hardcoded list to account for our custom protocol so that the router doesn't consider it dangerous. We are responsible for doing safety checks related to accessing resources using this protocol, which is handled in the protocol handler that's implemented in the main process.
