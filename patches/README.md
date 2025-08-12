# Patches

These patches use [patch-package](https://github.com/ds300/patch-package) to update dependencies which have unpublished
fixes.

## @comapeo/core

### [Do not watch fallback map patch when setting up SMP server plugin](./@comapeo+core+4.1.4+001+fix-smp-fallback-map-setup.patch)

By default, core sets up a file watcher for the `fallbackMapPath` option that's provided when instantiating `MapeoManager`. This does not work when packaging the app as an ASAR file (via Electron Forge) because watching a file within the ASAR directory is not possible. Instead, we change the setup so that it does not try to watch the file and instead make the assumption that the file always exists on instantiation, which is generally the case in CoMapeo Desktop (for now).

## styled-map-package

### [Fix CORS issue when serving fallback map when in development](styled-map-package+3.0.0+001+fix-CORS-issue-in-development.patch)

The default fallback offline map fails to load the app due to CORS issue in development. This is because the app is technically being served from a development server in development, which thus has a different origin than the map server that the map is being served from.
