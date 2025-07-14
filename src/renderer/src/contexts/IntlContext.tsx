import {
	createContext,
	use,
	type ComponentProps,
	type PropsWithChildren,
} from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IntlProvider as ReactIntlProvider } from 'react-intl'

import en from '../../../../translations/renderer/en.json'
import { CORNFLOWER_BLUE, ORANGE } from '../colors'
import { getAppSettingQueryOptions } from '../lib/queries/app-settings'

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

const messages = { en }

type SupportedLocale = keyof typeof messages

const LocaleContext = createContext<(locale: SupportedLocale) => void>(() => {})

export function IntlProvider({ children }: PropsWithChildren) {
	const { data: persistedLocale } = useSuspenseQuery(
		getAppSettingQueryOptions('locale'),
	)

	return (
		<ReactIntlProvider
			messages={
				// @ts-expect-error Fix later
				messages[persistedLocale]
			}
			locale={persistedLocale}
			defaultLocale="en"
			defaultRichTextElements={RICH_TEXT_MAPPINGS}
		>
			{children}
		</ReactIntlProvider>
	)
}

export function useLocaleUpdater() {
	return use(LocaleContext)
}
