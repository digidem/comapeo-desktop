import {
	createContext,
	use,
	useCallback,
	useState,
	type ComponentProps,
	type PropsWithChildren,
} from 'react'
import { IntlProvider as ReactIntlProvider } from 'react-intl'

import en from '../../../../translations/renderer/en.json'
import { CORNFLOWER_BLUE, ORANGE } from '../colors'

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
}

const messages = { en }

type SupportedLocale = keyof typeof messages

const LocaleContext = createContext<(locale: SupportedLocale) => void>(() => {})

export function IntlProvider({ children }: PropsWithChildren) {
	const [locale, setLocale] = useState<SupportedLocale>('en')

	const updateLocale = useCallback((l: SupportedLocale) => {
		window.runtime.updateLocale(l)
		setLocale(l)
	}, [])

	return (
		<ReactIntlProvider
			messages={messages[locale]}
			locale={locale}
			defaultLocale="en"
			defaultRichTextElements={RICH_TEXT_MAPPINGS}
		>
			<LocaleContext value={updateLocale}>{children}</LocaleContext>
		</ReactIntlProvider>
	)
}

export function useLocaleUpdater() {
	return use(LocaleContext)
}
