import { createRequire } from 'node:module'
import { createIntl, createIntlCache } from '@formatjs/intl'
import debug from 'debug'
import { app } from 'electron/main'
import * as v from 'valibot'

/**
 * @import {IntlShape} from '@formatjs/intl'
 * @import {LocaleSource, LocaleState, SupportedLanguageTag} from '../shared/intl.js'
 * @import {ConfigStore, PersistedLocale} from './config-store.js'
 */

const require = createRequire(import.meta.url)
const enTranslations = require('../../translations/main/en.json')
const esTranslations = require('../../translations/main/es.json')
const ptTranslations = require('../../translations/main/pt.json')

const SUPPORTED_LANGUAGES = require('../../languages.json')

const SUPPORTED_LANGUAGE_TAGS = /** @type {SupportedLanguageTag[]} */ (
	Object.keys(SUPPORTED_LANGUAGES)
)

const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

const log = debug('comapeo:main:intl')

/** @type {{ [key in SupportedLanguageTag]?: Record<string, unknown> }} */
const messages = {
	en: enTranslations,
	es: esTranslations,
	pt: ptTranslations,
}

export class Intl {
	static cache = createIntlCache()

	/** @type {ConfigStore} */
	#config

	/** @type {IntlShape<SupportedLanguageTag>} */
	#intl

	/** @type {LocaleSource} */
	#localeSource

	/**
	 * @param {Object} opts
	 * @param {ConfigStore} opts.configStore
	 */
	constructor({ configStore }) {
		this.#config = configStore

		const { value, source } = this.#getResolvedLocale(
			this.#config.get('locale'),
		)

		this.#intl = this.#createIntl(value)
		this.#localeSource = source
	}

	/**
	 * @param {SupportedLanguageTag} locale
	 *
	 * @returns {IntlShape<SupportedLanguageTag>}
	 */
	#createIntl(locale) {
		const localeMessages = messages[locale]

		if (!localeMessages) {
			log(`Could not find translated messages for language: ${locale}`)
		}

		return createIntl(
			{
				locale,
				defaultLocale: 'en',
				// @ts-expect-error Not worth fixing
				messages: {
					// Always load the English translations
					...messages['en'],
					// Override with the selected locale's translations
					...localeMessages,
				},
			},
			Intl.cache,
		)
	}

	/**
	 * @type {LocaleState}
	 */
	get localeState() {
		return {
			source: this.#localeSource,
			value: /** @type {SupportedLanguageTag} */ (this.#intl.locale),
		}
	}

	/**
	 * @param {PersistedLocale} locale
	 *
	 * @returns {{ value: SupportedLanguageTag; source: LocaleSource }}
	 */
	#getResolvedLocale(locale) {
		if (locale.useSystemPreferences) {
			const systemPreferredLocale =
				getBestMatchingLanguageFromSystemPreferences()

			if (systemPreferredLocale) {
				return {
					value: systemPreferredLocale,
					source: 'system',
				}
			} else {
				return {
					value: 'en',
					source: 'fallback',
				}
			}
		}

		v.assert(SupportedLanguageTagSchema, locale.languageTag)

		return {
			source: 'selected',
			value: locale.languageTag,
		}
	}

	/**
	 * @param {PersistedLocale} locale
	 */
	updateLocale(locale) {
		this.#config.set('locale', locale)

		const { value, source } = this.#getResolvedLocale(locale)

		if (source === 'system') {
			log(`Using system-preferred language: ${value}`)
		} else if (source === 'fallback') {
			log(`Using fallback language: ${value}`)
		} else {
			log(`Using selected language: ${value}`)
		}

		this.#intl = this.#createIntl(value)
		this.#localeSource = source
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
function getBestMatchingLanguageFromSystemPreferences() {
	const preferred = app.getPreferredSystemLanguages()

	for (const languageTag of preferred) {
		const baseTag = languageTag.split('-')[0]

		// Shouldn't happen
		if (!baseTag) {
			throw new Error(
				`Could not extract base tag from language tag: ${languageTag}`,
			)
		}

		if (v.is(SupportedLanguageTagSchema, baseTag)) {
			return baseTag
		}

		continue
	}

	return null
}
