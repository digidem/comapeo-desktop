import { createIntl, createIntlCache, IntlShape } from '@formatjs/intl'
import { app } from 'electron'
import { TypedEmitter } from 'tiny-typed-emitter'

import { logger } from './logger'
import { store } from './store'

const messages = {
  en: require('../../translations/main/en.json'),
}

// defaultLocale is the default locale of the app, not the user's locale.
export class Intl extends TypedEmitter<{
  'locale:change': (locale: string) => void
}> {
  static cache = createIntlCache()

  #intl: IntlShape<string>

  constructor(defaultLocale = 'en') {
    super()
    this.#intl = this.#createIntl(defaultLocale)
    logger.info('Locale', this.#intl.locale)
  }

  #createIntl(locale: string) {
    return createIntl(
      {
        locale,
        defaultLocale: 'en',
        // @ts-expect-error
        messages: messages[locale],
      },
      Intl.cache,
    )
  }

  get locale() {
    return this.#intl.locale
  }

  updateLocale(newLocale: string) {
    if (newLocale.length !== 2) {
      logger.error(
        'Tried to set locale and failed, must be a 2 character string',
        newLocale,
      )
      return
    }
    logger.info('Changing locale to', newLocale)
    this.#intl = this.#createIntl(newLocale)
    this.emit('locale:change', newLocale)
  }

  save(locale = this.#intl.locale) {
    store.set('locale', locale)
  }

  load() {
    try {
      return store.get('locale')
    } catch (_err) {
      logger.error('Failed to load locale from app settings')
      return null
    }
  }

  // Exposing mostly for convenience of usage
  formatMessage(...args: Parameters<IntlShape['formatMessage']>) {
    return this.#intl.formatMessage(...args)
  }
}

export const intl = new Intl('en')

// We only support generalized locales for now (i.e., no difference between
// Spanish/Espana and Spanish/Latin America)
export function getSystemLocale() {
  return app.getLocale().substring(0, 2)
}
