import { createRequire } from 'node:module'
import { createIntl, createIntlCache } from '@formatjs/intl'
import debug from 'debug'
import { app } from 'electron/main'
import { TypedEmitter } from 'tiny-typed-emitter'

const log = debug('comapeo:main:intl')

/**
 * @import {ConfigStore} from './config-store.js'
 */
const require = createRequire(import.meta.url)

const enTranslations = require('../../translations/main/en.json')

/**
 * @import {IntlShape} from '@formatjs/intl'
 */

const messages = {
	en: enTranslations,
}

/**
 * @extends {TypedEmitter<{ 'locale:change': (locale: string) => void }>}
 */
export class Intl extends TypedEmitter {
	static cache = createIntlCache()

	/** @type {ConfigStore} */
	#config

	/** @type {IntlShape<string>} */
	#intl

	/**
	 * @param {Object} opts
	 * @param {ConfigStore} opts.configStore
	 * @param {string} [opts.defaultLocale='en'] Default is `'en'`
	 */
	constructor({ configStore, defaultLocale = 'en' }) {
		super()
		this.#config = configStore
		this.#intl = this.#createIntl(this.#config.get('locale', defaultLocale))
		log('Locale set to', this.#intl.locale)
	}

	/**
	 * @param {string} locale
	 */
	#createIntl(locale) {
		return createIntl(
			{
				locale,
				defaultLocale: locale,
				// @ts-expect-error Ideally assert locale is supported first
				messages: messages[locale],
			},
			Intl.cache,
		)
	}

	get locale() {
		return this.#intl.locale
	}

	/**
	 * @param {string} newLocale
	 */
	updateLocale(newLocale) {
		if (newLocale.length !== 2) {
			log(
				'Tried to set locale and failed, must be a 2 character string',
				newLocale,
			)
			return
		}
		log('Changing locale to', newLocale)
		this.#intl = this.#createIntl(newLocale)
		this.emit('locale:change', newLocale)
	}

	save(locale = this.#intl.locale) {
		this.#config.set('locale', locale)
	}

	load() {
		try {
			return this.#config.get('locale')
		} catch (_err) {
			log('Failed to load locale from app settings')
			return null
		}
	}

	// Exposing mostly for convenience of usage
	/**
	 * @param {Parameters<IntlShape['formatMessage']>} args
	 *
	 * @returns {string}
	 */
	formatMessage(...args) {
		const result = this.#intl.formatMessage(...args)
		return Array.isArray(result) ? result.join() : result
	}
}

// We only support generalized locales for now (i.e., no difference between
// Spanish/Espana and Spanish/Latin America)
export function getSystemLocale() {
	return app.getLocale().substring(0, 2)
}
