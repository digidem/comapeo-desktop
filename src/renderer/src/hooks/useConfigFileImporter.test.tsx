import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSelectProjectConfigFile } from './mutations/file-system'

describe('useSelectProjectConfigFile', () => {
	beforeEach(() => {
		window.runtime = {
			getLocale: vi.fn().mockResolvedValue('en'),
			updateLocale: vi.fn(),
			selectFile: vi.fn(),
		}
	})

	it('returns filename and filepath from window.runtime.selectFile', async () => {
		vi.spyOn(window.runtime, 'selectFile').mockResolvedValue({
			name: 'myFile.comapeocat',
			path: '/Users/cindy/documents/myFile.comapeocat',
		})

		const queryClient = new QueryClient()

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)

		const { result } = renderHook(() => useSelectProjectConfigFile(), {
			wrapper,
		})

		await act(async () => {
			const val = await result.current.mutateAsync(undefined)
			expect(val).toEqual({
				name: 'myFile.comapeocat',
				path: '/Users/cindy/documents/myFile.comapeocat',
			})
		})
	})

	it('returns undefined if user cancels', async () => {
		vi.spyOn(window.runtime, 'selectFile').mockResolvedValue(undefined)

		const queryClient = new QueryClient()

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)

		const { result } = renderHook(() => useSelectProjectConfigFile(), {
			wrapper,
		})

		await act(async () => {
			const val = await result.current.mutateAsync(undefined)
			expect(val).toBeUndefined()
		})
	})
})
