# Development

## Table of Contents

- [Architecture](#architecture)
  - [Processes](#processes)
  - [Electron Runtime](#electron-runtime)
- [Developing locally](#developing-locally)
  - [Helpful tips about workflow](#helpful-tips-about-workflow)
  - [Helpful tips about configuration](#helpful-tips-about-configuration)
- [Testing](#testing)
  - [Unit tests](#unit-tests)
  - [End-to-end (e2e) tests](#end-to-end-e2e-tests)
- [Translations](#translations)
  - [Translations workflow](#translations-workflow)
- [Building the app](#building-the-app)

> [!TIP]
> Most of the npm scripts listed in this documentation use [Node's built-in command runner](https://nodejs.org/api/cli.html#--run) i.e. `node --run`. However, if you prefer using npm or need to avoid the [limitations](https://nodejs.org/api/cli.html#intentional-limitations), you can use `npm run` as well. Just note that some scripts will take longer to execute in this case.

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

### Shared code

The [`shared/`](../src/shared/) directory contains code that should be usable from any of the aforementioned processes. As of right now, `preload/` can only use types from this directory until a bundling step is in place. In practice, most of the code here is related to shared types or validators.

### Electron Runtime

The following use cases should generally be defined and set up in a preload script:

- communication between renderer and main processes
- any usage of Electron's renderer modules
- usage of a Node API (either directly or through a module) that's supported by the preload script sandbox

For example, in [`src/preload/main-window.js`](../src/preload/main-window.js), we expose an API to interact with the main process on `window.runtime`. This may change in the future but it's convenient for debugging purposes (e.g. testing the API using the devtools console).

## Developing locally

Make sure you have the desired Node version installed. For this project we encourage using the version that's specified in the [`.nvmrc`](../.nvmrc) (or [`.tool-versions`](../.tool-versions)) file. We recommend using a proper version management tool to install and manage Node versions, such as [nvm](https://github.com/nvm-sh/nvm), [fnm](https://github.com/Schniz/fnm), [asdf](https://asdf-vm.com/), or [mise](https://mise.jdx.dev/).

### Environment variables

If you need to use environment overrides, create a copy of the [`.env.template`](../.env.template) and call it `.env`.

If you're planning to use a different online map style, you'll need to specify a couple of other environment variables:

- `ONLINE_STYLE_URL`: Full URL that points to a compatible map's StyleJSON.
  - This should be a fully qualified http-based URL. For example, providers like Mapbox may use their own custom URL format, such as `mapbox://styles/mapbox/outdoors-v12`. Instead, you should convert this to something like `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12`.
  - If it's a [Mapbox](https://www.mapbox.com/) style, it is preferable to omit the `access_token` search param and specify `VITE_MAPBOX_ACCESS_TOKEN` instead.
- `VITE_MAPBOX_ACCESS_TOKEN`: Public token necessary for accessing [Mapbox](https://www.mapbox.com/)-provided resources. Follow the instructions [here](https://docs.mapbox.com/help/getting-started/access-tokens/) or reach out to the maintainers to obtain one.

### Running the app

Run the following commands to start the app:

```sh
npm install        # Install dependencies
node --run start   # Build translations, then build the app in development mode and start the development server
```

### Helpful tips about workflow

- When running the dev server:
  - Changes in the `src/renderer/` will be reflected in the app immediately
  - Changes in the `src/preload/` require the window to be refreshed to be reflected in the relevant window. Either go to the `View > Reload` menu option or use the keyboard shortcut (e.g. <kbd>CMD + R</kbd> on macOS, <kbd>CTRL + R</kbd> on Linux, Windows)
  - Changes to `src/main/` or `src/services/` require restarting the app. You can either:
    1. Stop the process that is running `npm start` and rerun it.
    2. Type <kbd>R + S + Enter</kbd> in the process that is running `node --run start`, which tells Forge to restart the main process.

- In development, the `userData` directory is set to the `<project_root>/data/default/` directory by default. On macOS, the logs directory is set to `<project_root>/logs/default/` by default. This provides the following benefits:
  - Avoids conflicting with the existing app if it's installed. Assuming the same app ID is used, Electron will default to using the OS-specific user data directory, which means that if you have a production version of the app installed, starting the development version will read and write from the production user data directory. Most of the time this is not desired (you generally don't want to mix production data and settings with your development environment). If it is desired, you will need to adjust the code that calls `app.setPath('userData', ...)` in [`src/main/index.ts`](../src/main/index.ts).
  - Easier to debug because you don't have to spend as much time to figure out which directory to look at (it's different depending on the operating system).
- If you want to change the `userData` directory, define an environment variable called `USER_DATA_PATH` that can be used when calling `node --run start`. For example, running `USER_DATA_PATH=./data/custom node --run start` will create and use the `data/custom` directory relative to the project root. This is useful for creating different "profiles" and isolating data for the purpose of working on features or reproducing bugs.
- **If you are installing a package that is only going to be used by code in the renderer (e.g. a React component library), you most likely should install it as a dev dependency instead of a direct dependency**. This differs from typical development workflows you see elsewhere, but the reasoning is that during the packaging stage of the app [`@electron/packager`](https://github.com/electron/packager) avoids copying dev dependencies found in the `node_modules` directory. Since we bundle our renderer code, we do not need to copy over these dependencies, which results in a significant decrease in disk space occupied by the app.
- We use [`debug`](https://github.com/debug-js/debug) for much of our logging in the main process. In order to see them, you can specify the `DEBUG` environment variable when running the app e.g. `DEBUG=comapeo:* node --run start`.

### Helpful tips about configuration

- The configuration for the renderer app is defined in the [Vite configuration file](../src/renderer/vite.config.ts) that lives in the `src/renderer`.
- The configuration for the Electron app is located in [`forge.config.ts`](/forge.config.ts).

### Testing

#### Unit tests

The renderer app (aka React code) can run unit tests with [Vitest](https://vitest.dev/) using `node --run vitest:run`. See [vitest run](https://vitest.dev/guide/cli.html#vitest-run) for more details.

#### End-to-end (e2e) tests

These tests use [Playwright](https://playwright.dev/) and its [experimental Electron support](https://playwright.dev/docs/api/class-electron). They require a packaged version of the app in order to be executed. The general steps are as follows:

1. Create the packaged application by running `COMAPEO_TEST=true APP_TYPE=internal node --run forge:package`. Specifying the environment variables is necessary.

2. Run the tests using `node --run test-e2e`.

When the tests finish, you can view a HTML report of the results using `npx playwright show-report tests-e2e/playwright-report` (the console will print this instruction too).

## Translations

The `messages/` directory contains the translation strings used by the app. Within this directory are directories for the main process (`messages/main/`) and renderer process (`messages/renderer/`). Messages found in `messages/main/` are typically needed for translating text that lives in native UI (e.g. the menu bar), whereas messages in `messages/renderer/` are needed for translating text that's used in the rendered web app.

In order to update translations, run `node --run intl`, which will extract messages and place them in the relevant `messages/` directory and then compile those messages into translated strings and place them in the `translations/` directory. For the renderer process specifically, it also generates a JSON file called [`translated-languages-list.json`](../src/renderer/src/generated/translated-languages.generated.json), which is used to by the app to know which languages are displayable without having to do that calculation it at runtime.

### Translations workflow

- For the main process:
  1. Use `defineMessages` from `@formatjs/intl` to create messages and use in the main process code.
  2. Run `node --run intl:main` (or `node --run intl`).

- For the renderer process:
  1. Use `defineMessages` from `react-intl` to create messages and use in the renderer process code.
  2. Run `node --run intl:renderer` (or `node --run intl`).

## Building the app

The [Electron Forge docs](https://www.electronforge.io/) are pretty informative (especially https://www.electronforge.io/core-concepts/build-lifecycle) but in a nutshell:

- `APP_TYPE=internal node --run forge:package`: generate an executable app bundle i.e. an executable that you can run in the command-line.

- `APP_TYPE=internal node --run forge:make`: generate a distributable installer or archives that you can install by opening using your filesystem.

All commands place the built assets in the `out/` directory.

If you're running into an error with any of the Forge-related commands but not seeing any output in the console, you probably have to prefix the command with `DEBUG=electron-forge` e.g. `DEBUG=electron-forge node --run forge:package`.

By default, we package the app in the [ASAR](https://github.com/electron/asar) format. However, it can be helpful to avoid doing that for debugging purposes (e.g. building locally), in which case you can specify a `ASAR=false` environment variable when running the relevant Forge command e.g. `ASAR=false APP_TYPE=internal node --run forge:package`.
