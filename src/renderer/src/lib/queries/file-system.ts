import type { UseMutationOptions } from '@tanstack/react-query'

import type { SelectedFile } from '../../../../shared/ipc'

/**
 * If the resolved value is `undefined` that means the user did not select a
 * file (i.e. cancelled the selection dialog)
 */
export function selectFileMutationOptions(): UseMutationOptions<
	SelectedFile | undefined,
	Error,
	{ extensionFilters: Array<string> } | undefined
> {
	return {
		mutationFn: async (opts) => {
			return window.runtime.selectFile(opts?.extensionFilters)
		},
	}
}
