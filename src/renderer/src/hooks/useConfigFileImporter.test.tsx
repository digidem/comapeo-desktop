import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSelectProjectConfigFile } from './mutations/file-system'

describe('useSelectProjectConfigFile', () => {
	beforeEach(() => {
		window.runtime = {
			selectFile: vi.fn(),
		}
	})

	it('returns file path from window.runtime.selectFile', async () => {
		vi.spyOn(window.runtime, 'selectFile').mockResolvedValue(
			'/some/path.comapeocat',
		)

		const queryClient = new QueryClient()

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)

		const { result } = renderHook(() => useSelectProjectConfigFile(), {
			wrapper,
		})

		let selectedPath: string | undefined

		await act(async () => {
			await result.current.mutateAsync(undefined, {
				onSuccess: (val) => {
					selectedPath = val
				},
			})
		})

		expect(selectedPath).toBe('/some/path.comapeocat')
	})

	it('returns undefined if user cancels', async () => {
		vi.spyOn(window.runtime, 'selectFile').mockResolvedValue(undefined)

		const queryClient = new QueryClient()

		const wrapper = ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		)

		const { result } = renderHook(() => useSelectProjectConfigFile(), {
			wrapper,
		})

		let selectedPath: string | undefined

		await act(async () => {
			await result.current.mutateAsync(undefined, {
				onSuccess: (val) => {
					selectedPath = val
				},
			})
		})

		expect(selectedPath).toBeUndefined()
	})
})
