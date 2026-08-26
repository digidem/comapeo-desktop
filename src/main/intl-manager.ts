import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createIntl, createIntlCache, type IntlShape } from '@formatjs/intl'
import { captureException } from '@sentry/electron'
import { app } from 'electron/main'
import { createDebug } from 'obug'
import { TypedEmitter } from 'tiny-typed-emitter'
import * as v from 'valibot'

import {
	DEFAULT_LANGUAGE_TAG,
	SupportedLanguageTagSchema,
	type LocaleSource,
	type LocaleState,
	type SupportedLanguageTag,
} from '../shared/intl.ts'
import type { CurrentStoreState } from './persisted-store.ts'

const log = createDebug('comapeo:main:intl-manager')

const messagesCache = new Map<SupportedLanguageTag, Record<string, unknown>>(
	// Load the default language's messages immediately
	[
		[
			DEFAULT_LANGUAGE_TAG,
			loadMessages(DEFAULT_LANGUAGE_TAG) as Record<string, unknown>,
		],
	],
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
		initialLocale: CurrentStoreState['locale']
	}) {
		super()

		const { value, source } = this.#getResolvedLocale(initialLocale)

		this.#intl = this.#createIntl(value)
		this.#localeSource = source
	}

	#createIntl(locale: SupportedLanguageTag): IntlShape<SupportedLanguageTag> {
		const systemPreferredLocales = app
			.getPreferredSystemLanguages()
			.filter((l) => v.is(SupportedLanguageTagSchema, l))

		let languagesToUse: Array<SupportedLanguageTag>

		if (v.is(SupportedLanguageTagSchema, locale)) {
			languagesToUse = Array.from(
				new Set([
					locale,
					...systemPreferredLocales,
					// NOTE: Always use the default language's messages for fallback purposes
					DEFAULT_LANGUAGE_TAG,
				]),
			)
		} else {
			log(`${locale} is not a supported locale.`)

			languagesToUse = Array.from(
				new Set([
					...systemPreferredLocales,
					// NOTE: Always use the default language's messages for fallback purposes
					DEFAULT_LANGUAGE_TAG,
				]),
			)
		}

		let combinedMessages: Record<string, unknown> = {}

		// NOTE: Reverse results so that highest preference gets applied latest
		for (const l of languagesToUse.reverse()) {
			let localeMessages = messagesCache.get(l)

			if (!localeMessages) {
				log(`Loading and caching messages for '${l}'`)

				try {
					localeMessages = loadMessages(l)
					messagesCache.set(l, localeMessages)
				} catch (err) {
					captureException(err)
				}
			}

			combinedMessages = { ...combinedMessages, ...localeMessages }
		}

		return createIntl(
			{
				locale,
				defaultLocale: DEFAULT_LANGUAGE_TAG,
				// @ts-expect-error Not worth fixing
				messages: combinedMessages,
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

	#getResolvedLocale(locale: CurrentStoreState['locale']): {
		value: SupportedLanguageTag
		source: LocaleSource
	} {
		if (locale.useSystemPreferences) {
			const systemPreferredLocale =
				getBestMatchingLanguageFromSystemPreferences()

			if (systemPreferredLocale) {
				return { value: systemPreferredLocale, source: 'system' }
			} else {
				return { value: DEFAULT_LANGUAGE_TAG, source: 'fallback' }
			}
		}

		v.assert(SupportedLanguageTagSchema, locale.languageTag)

		return { source: 'selected', value: locale.languageTag }
	}

	updateLocale(locale: CurrentStoreState['locale']) {
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

function getBestMatchingLanguageFromSystemPreferences() {
	const preferred = app.getPreferredSystemLanguages()

	for (const languageTag of preferred) {
		const [baseTag, regionTag] = languageTag.split('-')

		// NOTE: Shouldn't happen
		if (!baseTag) {
			throw new Error(`Cannot get base tag from ${languageTag}`)
		}

		if (regionTag) {
			const constructed = `${baseTag}-${regionTag}`

			if (v.is(SupportedLanguageTagSchema, constructed)) {
				return constructed
			}
		}

		if (v.is(SupportedLanguageTagSchema, baseTag)) {
			return baseTag
		}

		continue
	}

	return null
}

function loadMessages(languageTag: SupportedLanguageTag) {
	const [baseTag, regionTag] = languageTag.split('-')

	if (!baseTag) {
		throw new Error(`Cannot get base tag from ${languageTag}`)
	}

	const translationsDir = fileURLToPath(
		new URL(`../../translations/main`, import.meta.url),
	)

	const translationsFiles = Array.from(
		globSync(`${baseTag}*.json`, { cwd: translationsDir }),
	)
		// NOTE: Sort alphanumerically except for exact match, which should be last.
		.sort((a, b) => {
			if (regionTag && a.startsWith(languageTag)) {
				return 1
			}

			return b.localeCompare(a)
		})

	let messages = {} as Record<string, unknown>

	for (const filename of translationsFiles) {
		const translationMessages = JSON.parse(
			readFileSync(join(translationsDir, filename), 'utf-8'),
		)

		messages = { ...messages, ...translationMessages }
	}

	return messages
}
