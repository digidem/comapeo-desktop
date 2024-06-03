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

- `main/`: Code that runs Electron's [main process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-main-process)
  - has access to Node
- `services/`: Code that is spawned and coordinated by Electron's main process, usually as a [`utilityProcess`](https://www.electronjs.org/docs/latest/api/utility-process).
  - has access to Node
- `preload/`: Code that is injected as [preload scripts](https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts) into the renderer windows created by the main process
  - has access to browser APIs and [some Electron and Node APIs](https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts)
- `renderer/`: Code that runs in Electron's [renderer process](https://www.electronjs.org/docs/latest/tutorial/process-model#the-renderer-process)
  - has access to browser APIs

### Electron Runtime

The following use cases should generally be defined and set up in a preload script:

- communication between renderer and main processes
- any usage of Electron's renderer modules
- usage of a Node API (either directly or through a module) that's supported by the preload script sandbox

For example, in [`src/preload/main-window.ts`](../src/preload/main-window.ts), we expose an API to interact with the main process on `window.runtime`. This may change in the future but it's actually quite nice because it becomes more accessible for debugging purposes (e.g. testing the api using the devtools console)

## Developing locally

After cloning the repo locally. Run the following commands to get started:

```sh
npm install                # Install dependencies
npm start                  # Build translations, then build the app in development mode and start the development server
```

### Helpful tips about workflow

- Changes in the `renderer/` should immediately automatically be reflected in the app
- Changes in the `preload/` require the window to be refreshed to be reflected in the relevant window. Either go to the `View > Reload` menu option or use the keyboard shortcut (e.g. <kbd>CMD + R</kbd> on macOS, <kbd>CTRL + R</kbd> on Linux, Windows)
- Changes to `main/` and `services/` require restarting the app. Stop the process that is running `npm start` and rerun it
- In development, the `userData` directory is set to the `data/` directory by default. This provides the following benefits:
  - Avoids conflict with the existing app if it's installed. Assuming the same app id is used, Electron will default to using the OS-specific user data directory, which means that if you have a production version of the app installed, starting the development version will read and write from the production user data directory. Most of the time this is not desired (you generally don't want to mix production data and settings with your development environment). If it is desired, comment out the line that calls `app.setPath('userData', ...)` in [`src/main/index.ts`](../src/main/index.ts)
  - Easier to debug because you don't have to spend as much time to figure out which directory to look at (it changes based on operating system)
- If you want to change the `userData` directory, define an environment variable called `USER_DATA_PATH` that can be used when calling `npm start`. For example, running `USER_DATA_PATH=./my_data npm start` will create a `my_data` directory relative to the project root. This is useful for creating different "profiles" and isolating data for the purpose of testing features or reproducing bugs

### Helpful tips about configuration

- The most helpful starting point is at [`forge.config.js`](/forge.config.js). This defines the configuration used by Electron Forge and its Vite plugin. If you need to make updates to how various JS bundles are created, find the appropriate Vite config mapping in that file and update the config of interest.
- The TypeScript setup is a little clunky right now. The main challenge is that each of the processes have different runtime environments. There doesn't seem to be a straightfoward way to configure the project to be aware of all of the nuances of Electron's processes, so instead we define a TypeScript configuration for each process and stick a tsconfig file in each one, which is then used by the appropriate Vite configuration.
  - _NOTE: there's probably a much better way of setting this up - Andrew welcomes any input and changes to it_

## Translations

The `messages/` directory contains the translation strings used by the app. Within this directory are directories for the main process (`messages/main/`) and renderer process (`messages/renderer/`). Messages found in `messages/main/` are typically needed for translating text that lives in native UI (e.g. the menu bar), whereas messages in `messages/renderer/` are needed for translating text that's used in the rendered web app.

In order to update translations, run `npm run intl:translations`, which will extract messages and place them in the relevant `messages/` directory and then compile those messages into translated strings and place them in the `translations/` directory.

### Translations workflow

- For the main process:

  1. Use `defineMessage` (or `defineMessages`) from `@formatjs/intl` to create messages and use in the main process code
  2. Run npm run `intl:translations:main` (or`npm run intl:translations`)

- For the renderer process:

  1. Use `defineMessage` (or `defineMessages`) from `react-intl` to create messages and use in the renderer process code
  2. Run npm run `intl:translations:renderer` (or`npm run intl:translations`)

## Building the app

The [Electron Forge docs](https://www.electronforge.io/) are pretty informative (especially https://www.electronforge.io/core-concepts/build-lifecycle) but in a nutshell:

- `npm run package`: generate an executable app bundle i.e. an executable that you can run in the commandline

- `npm run make`: generate an distributable installer or archives that you can install by opening using your filesystem

- `npm run publish`: upload the distributable to some cloud storage for distribution

All commands place the built assets in the `out/` directory.
