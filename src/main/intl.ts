import { createIntl, createIntlCache, type IntlShape } from '@formatjs/intl'
import debug from 'debug'
import { app } from 'electron/main'
import * as v from 'valibot'

import SUPPORTED_LANGUAGES from '../../languages.json' with { type: 'json' }
import enTranslations from '../../translations/main/en.json' with { type: 'json' }
import esTranslations from '../../translations/main/es.json' with { type: 'json' }
import ptTranslations from '../../translations/main/pt.json' with { type: 'json' }
import type {
	LocaleSource,
	LocaleState,
	SupportedLanguageTag,
} from '../shared/intl.js'
import type { ConfigStore, PersistedLocale } from './config-store.js'

const SUPPORTED_LANGUAGE_TAGS = Object.keys(
	SUPPORTED_LANGUAGES,
) as Array<SupportedLanguageTag>

const SupportedLanguageTagSchema = v.union(
	SUPPORTED_LANGUAGE_TAGS.map((t) => v.literal(t)),
)

const log = debug('comapeo:main:intl')

const messages: { [key in SupportedLanguageTag]?: Record<string, unknown> } = {
	en: enTranslations,
	es: esTranslations,
	pt: ptTranslations,
}

export class Intl {
	static cache = createIntlCache()

	#config: ConfigStore

	#intl: IntlShape<SupportedLanguageTag>

	#localeSource: LocaleSource

	constructor({ configStore }: { configStore: ConfigStore }) {
		this.#config = configStore

		const { value, source } = this.#getResolvedLocale(
			this.#config.get('locale'),
		)

		this.#intl = this.#createIntl(value)
		this.#localeSource = source
	}

	#createIntl(locale: SupportedLanguageTag): IntlShape<SupportedLanguageTag> {
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

	get localeState(): LocaleState {
		return {
			source: this.#localeSource,
			value: this.#intl.locale as SupportedLanguageTag,
		}
	}

	#getResolvedLocale(locale: PersistedLocale): {
		value: SupportedLanguageTag
		source: LocaleSource
	} {
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

	updateLocale(locale: PersistedLocale) {
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
	formatMessage(...args: Parameters<IntlShape['formatMessage']>): string {
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
