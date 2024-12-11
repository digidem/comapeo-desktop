import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { MapLayout } from './_Map'

vi.mock('@tanstack/react-router', () => ({
	useNavigate: vi.fn(() => {
		return { navigate: vi.fn() }
	}),
	createFileRoute: vi.fn(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return (options: any) => ({ component: options.component }) // Mocked implementation
	}),
	Outlet: () => <div>Mocked Outlet</div>,
}))

test('renders something in the jsdom', () => {
	render(<MapLayout />)
	expect(screen).toBeDefined()
})
