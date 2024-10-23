import {
	createContext,
	useCallback,
	useContext,
	useState,
	type PropsWithChildren,
} from 'react'
import { IntlProvider as ReactIntlProvider } from 'react-intl'

import en from '../../../../translations/renderer/en.json'

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
		>
			<LocaleContext.Provider value={updateLocale}>
				{children}
			</LocaleContext.Provider>
		</ReactIntlProvider>
	)
}

export function useLocaleUpdater() {
	return useContext(LocaleContext)
}
