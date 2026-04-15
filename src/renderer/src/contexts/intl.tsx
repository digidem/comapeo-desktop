import {
	useDeferredValue,
	useMemo,
	type ComponentProps,
	type PropsWithChildren,
} from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
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

	const combinedMessages = useMemo(() => {
		return { ...defaultLanguageMessages, ...localeMessages }
	}, [defaultLanguageMessages, localeMessages])

	return (
		<ReactIntlProvider
			// @ts-expect-error Not worth fixing
			messages={combinedMessages}
			locale={persistedLocale}
			defaultLocale={DEFAULT_LANGUAGE_TAG}
			defaultRichTextElements={RICH_TEXT_MAPPINGS}
		>
			{children}
		</ReactIntlProvider>
	)
}
