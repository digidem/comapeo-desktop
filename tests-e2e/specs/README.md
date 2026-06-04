# E2E Specs

## Tips

### Avoid using [`Locator.check()`](https://playwright.dev/docs/api/class-locator#locator-check) and [`toBeChecked`](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-be-checked)

Unfortunately, these have several limitations in our context and do not work well with functionality that only updates the `.checked` JS property.

- https://github.com/microsoft/playwright/issues/39655
- https://github.com/mui/material-ui/issues/20364

Instead, use [`toHaveJSProperty`](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-js-property).
