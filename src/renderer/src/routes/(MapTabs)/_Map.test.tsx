/**
 * @vitest-environment jsdom
 */

import { RouterProvider, createRouter } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { routeTree } from '../../routeTree.gen'

const router = createRouter({ routeTree })

test('renders something', () => {
	render(<RouterProvider router={router} />)
	const text = screen.getByText('Tab 1')
	expect(text).toBeDefined()
})
