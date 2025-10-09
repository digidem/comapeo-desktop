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
		return (
			<b
				// https://github.com/formatjs/formatjs/pull/5032#issuecomment-3371489291
				key="bold"
			>
				{parts}
			</b>
		)
	},
	orange: (parts) => {
		return (
			<span
				// https://github.com/formatjs/formatjs/pull/5032#issuecomment-3371489291
				key="orange"
				style={{ color: ORANGE }}
			>
				{parts}
			</span>
		)
	},
	blue: (parts) => {
		return (
			<span
				// https://github.com/formatjs/formatjs/pull/5032#issuecomment-3371489291
				key="blue"
				style={{ color: CORNFLOWER_BLUE }}
			>
				{parts}
			</span>
		)
	},
	br: () => {
		return (
			<br
				// https://github.com/formatjs/formatjs/pull/5032#issuecomment-3371489291
				key="break"
			/>
		)
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
			wrapRichTextChunksInFragment
			defaultRichTextElements={RICH_TEXT_MAPPINGS}
		>
			{children}
		</ReactIntlProvider>
	)
}
