# Mapeo Desktop Next

Scaffolded using https://www.electronforge.io/templates/vite

Important things to note:

- Preload scripts do not rerun when the app reloads via React Fast Refresh. However, triggering window reloads manually _does_ rerun preload scripts.
- For the time being, we expose the client api using the window object because
  1. Dealing with re-initialization when app changes occur in development requires more work (see first point)
  2. It may be helpful to have access to the client api for debugging purposes in the devtools
- Any "background processes" spawned by the main process are referred to as "services". See [`src/service/README.md`](./src/service/mapeo-core.js) for more details
