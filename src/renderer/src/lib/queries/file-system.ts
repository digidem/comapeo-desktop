import type { UseMutationOptions } from '@tanstack/react-query'

import type { SelectedFile } from '../../../../preload/runtime'

/**
 * If the resolved value is `undefined` that means the user did not select a
 * file (i.e. cancelled the selection dialog)
 */
export function selectCategoriesFileMutationOptions(): UseMutationOptions<
	SelectedFile | undefined,
	Error,
	undefined
> {
	return {
		mutationFn: async () => {
			return window.runtime.selectFile(['comapeocat'])
		},
	}
}
