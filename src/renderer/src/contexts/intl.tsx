import {
	useDeferredValue,
	useEffect,
	useMemo,
	type ComponentProps,
	type PropsWithChildren,
} from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import {
	queryOptions,
	useSuspenseQueries,
	useSuspenseQuery,
} from '@tanstack/react-query'
import type { Locale } from 'date-fns'
import { IntlProvider as ReactIntlProvider } from 'react-intl'

import { DEFAULT_LANGUAGE_TAG } from '../../../shared/intl.ts'
import { CORNFLOWER_BLUE, ORANGE } from '../colors.ts'
import { getLocaleStateQueryOptions } from '../lib/queries/app-settings.ts'
import { getTranslatedMessagesQueryOptions } from '../lib/queries/intl.ts'

const RICH_TEXT_MAPPINGS: ComponentProps<
	typeof ReactIntlProvider
>['defaultRichTextElements'] = {
	b: (parts) => {
		return <b>{parts}</b>
	},
	orange: (parts) => {
		return <span style={{ color: ORANGE }}>{parts}</span>
	},
	blue: (parts) => {
		return <span style={{ color: CORNFLOWER_BLUE }}>{parts}</span>
	},
	br: () => {
		return <br />
	},
}

const DATE_FN_LOCALES = import.meta.glob<Locale>(['./*.js', '!./cdn.*'], {
	base: '/../../node_modules/date-fns/locale/',
	import: 'default',
})

export function IntlProvider({ children }: PropsWithChildren) {
	const { data: persistedLocale } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	// NOTE: We always load the default language messages to use as a fallback for missing message keys
	const { data: defaultLanguageMessages } = useSuspenseQuery(
		getTranslatedMessagesQueryOptions(DEFAULT_LANGUAGE_TAG),
	)

	// NOTE: Prevents the suspense boundary from showing the fallback when we update the locale,
	// avoiding a jarring UI flicker.
	const deferredLocale = useDeferredValue(persistedLocale)

	const { data: localeMessages } = useSuspenseQuery(
		getTranslatedMessagesQueryOptions(deferredLocale),
	)

	const dateFnLocale = useSuspenseQueries({
		queries: Array.from(new Set([deferredLocale, 'en-US'])).map((l) =>
			queryOptions({
				queryKey: ['dateFnLocale', l] as const,
				queryFn: async () => {
					const baseTag = l.split('-')[0]!

					const localePromise =
						DATE_FN_LOCALES[`./${l}.js`] || DATE_FN_LOCALES[`./${baseTag}.js`]

					return localePromise ? localePromise() : null
				},
				// Basically only want this to happen once.
				staleTime: Infinity,
				gcTime: Infinity,
			}),
		),
		combine: (queries) => {
			for (const q of queries) {
				if (q.data !== null) {
					return q.data
				}
			}

			// NOTE: Shouldn't happen
			throw new Error('All date-fn locale queries are missing data')
		},
	})

	const combinedMessages = useMemo(() => {
		return { ...defaultLanguageMessages, ...localeMessages }
	}, [defaultLanguageMessages, localeMessages])

	useEffect(
		function updateDocumentLang() {
			document.documentElement.lang = persistedLocale
		},
		[persistedLocale],
	)

	return (
		<ReactIntlProvider
			// @ts-expect-error Not worth fixing
			messages={combinedMessages}
			locale={persistedLocale}
			defaultLocale={DEFAULT_LANGUAGE_TAG}
			defaultRichTextElements={RICH_TEXT_MAPPINGS}
		>
			<LocalizationProvider
				dateAdapter={AdapterDateFns}
				adapterLocale={dateFnLocale}
			>
				{children}
			</LocalizationProvider>
		</ReactIntlProvider>
	)
}
