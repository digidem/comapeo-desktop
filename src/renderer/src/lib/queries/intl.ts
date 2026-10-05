import { useEffect, useState } from 'react'
import { queryOptions } from '@tanstack/react-query'

import type { SupportedLanguageTag } from '../../../../shared/intl.ts'
import { getLanguageInfo, loadTranslations } from '../intl.ts'

export const BASE_QUERY_KEY = 'language'

function getTranslatedMessagesQueryKey(language: SupportedLanguageTag) {
	return [BASE_QUERY_KEY, language]
}

export function getTranslatedMessagesQueryOptions(
	languageTag: SupportedLanguageTag,
) {
	return queryOptions({
		queryKey: getTranslatedMessagesQueryKey(languageTag),
		queryFn: async () => {
			return loadTranslations(languageTag)
		},
		// Basically only want this to happen once.
		staleTime: Infinity,
		gcTime: Infinity,
	})
}

export function useNavigatorLanguages() {
	const [languages, setLanguages] = useState(() => {
		return getNavigatorLanguages()
	})

	useEffect(() => {
		function onLanguageChange() {
			setLanguages(getNavigatorLanguages())
		}

		window.addEventListener('languagechange', onLanguageChange)

		return () => {
			window.removeEventListener('languagechange', onLanguageChange)
		}
	}, [setLanguages])

	return languages
}

function getNavigatorLanguages(): Array<{
	value: string
	baseLanguageInfo?: { englishName: string; nativeName: string }
}> {
	return navigator.languages.map((l) => {
		// NOTE: We intentionally do not show the regional variant for now.
		// This will change in the future once we have
		// multiple language variants that we actually support.
		const baseTag = l.split('-')[0]

		const baseLanguageInfo = baseTag
			? getLanguageInfo(baseTag as SupportedLanguageTag)
			: undefined

		return { value: l, baseLanguageInfo }
	})
}
