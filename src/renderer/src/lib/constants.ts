export const DEVICE_NAME_MAX_LENGTH_GRAPHEMES = 60
export const INPUT_NAME_MAX_BYTES = 512
export const PROJECT_NAME_MAX_LENGTH_GRAPHEMES = 100
export const PROJECT_DESCRIPTION_MAX_LENGTH_GRAPHEMES = 60

const FALLBACK_TITLE_BAR_HEIGHT_PX = 40

// NOTE: This is provided by Electron when using the `titleBarOverlay` option for creating a BrowserWindow
// - https://www.electronjs.org/docs/latest/api/structures/base-window-options
// - https://github.com/WICG/window-controls-overlay/blob/main/explainer.md#css-environment-variables
export const TITLE_BAR_HEIGHT = `env(titlebar-area-height, ${FALLBACK_TITLE_BAR_HEIGHT_PX}px)`

export const DIALOG_CONTAINER_ID = 'dialog-container'
