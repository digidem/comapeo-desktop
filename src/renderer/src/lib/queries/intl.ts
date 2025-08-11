import { queryOptions } from '@tanstack/react-query'

import type { SupportedLanguageTag } from '../../../../shared/intl'
import { loadTranslations } from '../intl'

export const BASE_QUERY_KEY = 'language'

function getTranslatedMessagesQueryKey(language: SupportedLanguageTag) {
	return [BASE_QUERY_KEY, language]
}

export function getTranslatedMessagesQueryOptions(
	language: SupportedLanguageTag,
) {
	return queryOptions({
		queryKey: getTranslatedMessagesQueryKey(language),
		queryFn: async () => {
			return loadTranslations(language)
		},
		// Basically only want this to happen once.
		staleTime: Infinity,
		gcTime: Infinity,
	})
}
