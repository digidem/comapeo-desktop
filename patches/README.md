# Patches

These patches use [patch-package](https://github.com/ds300/patch-package) to update dependencies which have unpublished
fixes.

## @comapeo/core

### [Do not watch fallback map patch when setting up SMP server plugin](./@comapeo+core+7.5.2+001+fix-smp-fallback-map-setup.patch)

By default, core sets up a file watcher for the `fallbackMapPath` option that's provided when instantiating `MapeoManager`. This does not work when packaging the app as an ASAR file (via Electron Forge) because watching a file within the ASAR directory is not possible. Instead, we change the setup so that it does not try to watch the file and instead make the assumption that the file always exists on instantiation, which is generally the case in CoMapeo Desktop (for now).

## @electron-forge/core

### [Fix app not closing when qutting start command terminal UI](./@electron-forge+core+8.0.1+001+close-app-on-sig-kill.patch)

Terminating the start command UI left the app running. Issue is already fixed upstream (see https://github.com/electron/forge/pull/4437) but not released yet.

## @homebridge/ciao

### [Do not exit the process on republishing errors](./@homebridge+ciao+1.3.12+001+handle-republish-errors.patch)

Instead of exiting the process on republishing errors, we emit events that allow graceful error handling to occur in consuming application code. See description in https://github.com/gmaclennan/ciao/pull/1 for more details.
