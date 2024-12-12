import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useConfigFileImporter } from './useConfigFileImporter'

describe('useConfigFileImporter', () => {
	it('initially returns null for fileName and error', () => {
		const { result } = renderHook(() => useConfigFileImporter())
		expect(result.current.fileName).toBeNull()
		expect(result.current.error).toBeNull()
	})

	it('sets fileName and clears error when a valid .comapeocat file is selected', () => {
		const { result } = renderHook(() => useConfigFileImporter())
		console.log('result', result)

		const mockFile = new File(['test content'], 'project.comapeocat', {
			type: 'text/plain',
		})
		// @ts-expect-error: Mocked event does not fully match ChangeEvent type, safe to ignore because main goal is to test functionality not the typing in the test
		const mockEvent = {
			target: { files: [mockFile] },
		} as React.ChangeEvent<HTMLInputElement>

		act(() => {
			result.current.handleFileSelect(mockEvent)
		})

		expect(result.current.fileName).toBe('project.comapeocat')
		expect(result.current.error).toBeNull()
	})

	it('sets an error and resets fileName to null for invalid file type', () => {
		const { result } = renderHook(() => useConfigFileImporter())

		const mockFile = new File(['test content'], 'project.txt', {
			type: 'text/plain',
		})
		// @ts-expect-error: Mocked event does not fully match ChangeEvent type, safe to ignore because main goal is to test functionality not the typing in the test
		const mockEvent = {
			target: { files: [mockFile] },
		} as React.ChangeEvent<HTMLInputElement>

		act(() => {
			result.current.handleFileSelect(mockEvent)
		})

		expect(result.current.fileName).toBeNull()
		expect(result.current.error).toBe(
			'Invalid file type. Please select a .comapeocat file.',
		)
	})

	it('handles no file selected scenario', () => {
		const { result } = renderHook(() => useConfigFileImporter())
		// @ts-expect-error: Mocked event does not fully match ChangeEvent type, safe to ignore because main goal is to test functionality not the typing in the test
		const mockEvent = {
			target: { files: [] },
		} as React.ChangeEvent<HTMLInputElement>

		act(() => {
			result.current.handleFileSelect(mockEvent)
		})

		expect(result.current.fileName).toBeNull()
		expect(result.current.error).toBeNull()
	})
})
