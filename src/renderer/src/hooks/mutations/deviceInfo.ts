import { getDeviceInfoQueryKey, useClientApi } from '@comapeo/core-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useEditDeviceInfo = () => {
	const api = useClientApi()
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['device'],
		mutationFn: async (name: string) => {
			return api.setDeviceInfo({
				name,
				deviceType: 'desktop',
			})
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getDeviceInfoQueryKey() })
		},
	})
}
