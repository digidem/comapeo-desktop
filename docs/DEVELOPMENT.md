# Development

## Table of Contents

- [Architecture](#architecture)
  - [Processes](#processes)
  - [Electron Runtime](#electron-runtime)
- [Developing locally](#developing-locally)
  - [Helpful tips about workflow](#helpful-tips-about-workflow)
  - [Helpful tips about configuration](#helpful-tips-about-configuration)
- [Translations](#translations)
  - [Translations workflow](#translations-workflow)
- [Building the app](#building-the-app)

## Architecture

### Processes

The following directories can be found in `src/` and approximately represent the Electron processes of interest:

- [`main/`](../src/main/): Code that runs Electron's [main process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process).
  - has access to Node
  - has direct access to Electron APIs
- [`services/`](../src/services): Code that is spawned and coordinated by Electron's main process, usually as a [`utilityProcess`](https://www.electronjs.org/docs/latest/api/utility-process).
  - has access to Node
  - does not have direct access to Electron APIs.
- [`preload/`](../src/preload/): Code that is injected as [preload scripts](https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts) into the renderer windows created by the main process.
  - has access to browser APIs and [some Electron and Node APIs](https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts)
- [`renderer/`](../src/renderer/): Code that runs in Electron's [renderer process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-renderer-process).
  - has access to browser APIs

### Electron Runtime

The following use cases should generally be defined and set up in a preload script:

- communication between renderer and main processes
- any usage of Electron's renderer modules
- usage of a Node API (either directly or through a module) that's supported by the preload script sandbox

For example, in [`src/preload/main-window.js`](../src/preload/main-window.js), we expose an API to interact with the main process on `window.runtime`. This may change in the future but it's actually quite nice because it becomes more accessible for debugging purposes (e.g. testing the API using the devtools console).

## Developing locally

Make sure you have the desired Node version installed. For this project we encourage using the version that's specified in the [`.nvmrc`](../.nvmrc) (or [`.tool-versions`](../.tool-versions)) file. We recommend using a proper version management tool to install and manage Node versions, such as [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), [asdf](https://asdf-vm.com/), or [mise](https://mise.jdx.dev/).

### Environment variables

Create a copy of the [`.env.template`](../.env.template) and call it `.env`.

- `MAPBOX_ACCESS_TOKEN`: A public access token from Mapbox ([documentation](https://docs.mapbox.com/help/getting-started/access-tokens/)) that allows the app to access online map styles. Reach out to the team or create your own.

### Running the app

Run the following commands to start the app:

```sh
npm install                # Install dependencies
npm start                  # Build translations, then build the app in development mode and start the development server
```

### Helpful tips about workflow

- Changes in the `src/renderer/` should immediately automatically be reflected in the app
- Changes in the `src/preload/` require the window to be refreshed to be reflected in the relevant window. Either go to the `View > Reload` menu option or use the keyboard shortcut (e.g. <kbd>CMD + R</kbd> on macOS, <kbd>CTRL + R</kbd> on Linux, Windows)
- Changes to `src/main/` require restarting the app. You can either:
  1. Stop the process that is running `npm start` and rerun it.
  2. Type <kbd>R + S + Enter</kbd> in the process that is running `npm start`, which tells Forge to restart the main process.
- In development, the `userData` directory is set to the `data/` directory by default. This provides the following benefits:
  - Avoids conflicting with the existing app if it's installed. Assuming the same app id is used, Electron will default to using the OS-specific user data directory, which means that if you have a production version of the app installed, starting the development version will read and write from the production user data directory. Most of the time this is not desired (you generally don't want to mix production data and settings with your development environment). If it is desired, comment out the line that calls `app.setPath('userData', ...)` in [`src/main/index.js`](../src/main/index.js)
  - Easier to debug because you don't have to spend as much time to figure out which directory to look at (it changes based on operating system)
- If you want to change the `userData` directory, define an environment variable called `USER_DATA_PATH` that can be used when calling `npm start`. For example, running `USER_DATA_PATH=./my_data npm start` will create a `my_data` directory relative to the project root. This is useful for creating different "profiles" and isolating data for the purpose of testing features or reproducing bugs
- **If you are installing a package that is only going to be used by code the renderer (e.g. a React component library), you most likely should install it as a dev dependency instead of a direct dependency**. This differs from typical development workflows you see elsewhere, but the reasoning is that during the packaging stage of the app, [`@electron/packager`](https://github.com/electron/packager) avoids copying dev dependencies found in the `node_modules` directory. Since we bundle our renderer code, we do not need to copy over these dependencies, which results in a significant decrease in disk space occupied by the app.

### Helpful tips about configuration

- The configuration for the renderer app is defined in the [Vite configuration file](../src/renderer/vite.config.js) that lives in the `src/renderer`.
- The configuration for the Electron app is located in [`forge.config.js`](/forge.config.js).

## Translations

The `messages/` directory contains the translation strings used by the app. Within this directory are directories for the main process (`messages/main/`) and renderer process (`messages/renderer/`). Messages found in `messages/main/` are typically needed for translating text that lives in native UI (e.g. the menu bar), whereas messages in `messages/renderer/` are needed for translating text that's used in the rendered web app.

In order to update translations, run `npm run intl:translations`, which will extract messages and place them in the relevant `messages/` directory and then compile those messages into translated strings and place them in the `translations/` directory.

### Translations workflow

- For the main process:

  1. Use `defineMessage` (or `defineMessages`) from `@formatjs/intl` to create messages and use in the main process code.
  2. Run npm run `intl:translations:main` (or`npm run intl:translations`).

- For the renderer process:

  1. Use `defineMessage` (or `defineMessages`) from `react-intl` to create messages and use in the renderer process code.
  2. Run npm run `intl:translations:renderer` (or`npm run intl:translations`).

## Building the app

The [Electron Forge docs](https://www.electronforge.io/) are pretty informative (especially https://www.electronforge.io/core-concepts/build-lifecycle) but in a nutshell:

- `npm run forge:package`: generate an executable app bundle i.e. an executable that you can run in the command-line.

- `npm run forge:make`: generate an distributable installer or archives that you can install by opening using your filesystem.

- `npm run forge:publish`: upload the distributable to some cloud storage for distribution.

All commands place the built assets in the `out/` directory.

If you're running into an error with any of the Forge-related commands but not seeing any output in the console, you probably have to prefix the command with `DEBUG=electron-forge` e.g. `DEBUG=electron-forge npm run forge:package`.

By default, we package the app in the [ASAR](https://github.com/electron/asar) format. However, it can be helpful to avoid doing that for debugging purposes (e.g. building locally), in which case you can specify a `NO_ASAR` env variable when running the relevant Forge command e.g. `NO_ASAR=true npm run forge:package`.
