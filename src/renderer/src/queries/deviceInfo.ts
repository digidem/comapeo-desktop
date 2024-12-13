import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'

import { useApi } from '../contexts/ApiContext'

export const DEVICE_INFO_KEY = 'deviceInfo'

export const useDeviceInfo = () => {
	const api = useApi()

	return useSuspenseQuery({
		queryKey: [DEVICE_INFO_KEY],
		queryFn: async () => {
			return await api.getDeviceInfo()
		},
	})
}

export const useEditDeviceInfo = () => {
	const api = useApi()
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
			queryClient.invalidateQueries({ queryKey: [DEVICE_INFO_KEY] })
		},
	})
}
