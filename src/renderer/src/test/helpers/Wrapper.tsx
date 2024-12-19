import type { ReactNode } from 'react'
import { ClientApiProvider } from '@comapeo/core-react'
import type { MapeoClientApi } from '@comapeo/ipc'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'

import { ReuseableProviderWrapper } from '../../App'

export const WrapperWithClient = ({
	children,
	clientApi,
	queryClient,
}: {
	children: ReactNode
	clientApi: MapeoClientApi
	queryClient: QueryClient
}) => {
	return (
		<ReuseableProviderWrapper>
			<QueryClientProvider client={queryClient}>
				<ClientApiProvider clientApi={clientApi}>{children}</ClientApiProvider>
			</QueryClientProvider>
		</ReuseableProviderWrapper>
	)
}
