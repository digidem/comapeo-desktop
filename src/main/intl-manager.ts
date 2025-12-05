import { readFileSync } from 'node:fs'
import { createIntl, createIntlCache, type IntlShape } from '@formatjs/intl'
import { captureException } from '@sentry/electron'
import debug from 'debug'
import { app } from 'electron/main'
import { TypedEmitter } from 'tiny-typed-emitter'
import * as v from 'valibot'

import {
	SupportedLanguageTagSchema,
	type LocaleSource,
	type LocaleState,
	type SupportedLanguageTag,
} from '#shared/intl.ts'
import type { PersistedStateV1 } from './persisted-store.ts'

const log = debug('comapeo:main:intl-manager')

const messagesCache = new Map<SupportedLanguageTag, Record<string, unknown>>(
	// Load the English messages immediately
	[['en', loadMessages('en') as Record<string, unknown>]],
)

type IntlManagerEvents = {
	'locale-state': (state: LocaleState) => void
}

export class IntlManager extends TypedEmitter<IntlManagerEvents> {
	static cache = createIntlCache()

	#intl: IntlShape<SupportedLanguageTag>

	#localeSource: LocaleSource

	constructor({
		initialLocale,
	}: {
		initialLocale: PersistedStateV1['locale']
	}) {
		super()

		const { value, source } = this.#getResolvedLocale(initialLocale)

		this.#intl = this.#createIntl(value)
		this.#localeSource = source
	}

	#createIntl(locale: SupportedLanguageTag): IntlShape<SupportedLanguageTag> {
		// Always use the English messages for fallback purposes
		let messages = messagesCache.get('en')!

		const baseTag = locale.split('-')[0]

		if (v.is(SupportedLanguageTagSchema, baseTag)) {
			let localeMessages = messagesCache.get(baseTag)

			if (!localeMessages) {
				log(`Loading and caching messages for '${locale}'`)

				try {
					localeMessages = loadMessages(baseTag) as Record<string, unknown>
					messagesCache.set(baseTag, localeMessages)
				} catch (err) {
					captureException(err)
				}
			}

			messages = {
				...messages,
				...localeMessages,
			}
		} else {
			log(`Could not extract base tag from language tag: ${locale}`)
		}

		return createIntl(
			{
				locale,
				defaultLocale: 'en',
				// @ts-expect-error Not worth fixing
				messages,
			},
			IntlManager.cache,
		)
	}

	get localeState(): LocaleState {
		return {
			source: this.#localeSource,
			value: this.#intl.locale as SupportedLanguageTag,
		}
	}

	#getResolvedLocale(locale: PersistedStateV1['locale']): {
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

	updateLocale(locale: PersistedStateV1['locale']) {
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

		this.emit('locale-state', this.localeState)
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

function loadMessages(baseTag: SupportedLanguageTag) {
	return JSON.parse(
		readFileSync(
			new URL(`../../translations/main/${baseTag}.json`, import.meta.url),
			{ encoding: 'utf-8' },
		),
	) as unknown
}
