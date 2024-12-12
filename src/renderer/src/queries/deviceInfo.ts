import { getDeviceInfoQueryKey, useClientApi } from '@comapeo/core-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useEditDeviceInfo = () => {
	const clientApi = useClientApi()
	const queryClient = useQueryClient()

	return useMutation({
		mutationKey: ['device'],
		mutationFn: async (name: string) => {
			return clientApi.setDeviceInfo({
				name,
				deviceType: 'desktop',
			})
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: getDeviceInfoQueryKey() })
		},
	})
}
