import { useMutation } from '@tanstack/react-query'

/**
 * If the resolved value is `undefined` that means the user did not select a
 * file (i.e. cancelled the selection dialog)
 */
export function useSelectProjectConfigFile() {
	return useMutation({
		mutationFn: async () => {
			return window.runtime.selectFile(['comapeocat'])
		},
	})
}
