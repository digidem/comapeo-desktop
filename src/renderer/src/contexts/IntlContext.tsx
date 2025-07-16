import {
	useDeferredValue,
	useMemo,
	type ComponentProps,
	type PropsWithChildren,
} from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IntlProvider as ReactIntlProvider } from 'react-intl'

import { CORNFLOWER_BLUE, ORANGE } from '../colors'
import { getLocaleStateQueryOptions } from '../lib/queries/app-settings'
import { getTranslatedMessagesQueryOptions } from '../lib/queries/intl'

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

	// We always load the English ones to use as a fallback for missing message keys
	const { data: englishMessages } = useSuspenseQuery(
		getTranslatedMessagesQueryOptions('en'),
	)

	// Prevents the suspense boundary from showing the fallback when we update the locale,
	// avoiding a jarring UI flicker.
	const deferredLocale = useDeferredValue(persistedLocale)

	const { data: localeMessages } = useSuspenseQuery(
		getTranslatedMessagesQueryOptions(deferredLocale),
	)

	const messagesToUse = useMemo(() => {
		return { ...englishMessages, ...localeMessages }
	}, [englishMessages, localeMessages])

	return (
		<ReactIntlProvider
			// @ts-expect-error Not worth fixing
			messages={messagesToUse}
			locale={persistedLocale}
			defaultLocale="en"
			defaultRichTextElements={RICH_TEXT_MAPPINGS}
		>
			{children}
		</ReactIntlProvider>
	)
}
