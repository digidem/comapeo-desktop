import React from 'react'
import { ClientApiProvider } from '@comapeo/core-react'
import type { MapeoClientApi } from '@comapeo/ipc'
import {
	RouterProvider,
	createMemoryHistory,
	createRouter,
} from '@tanstack/react-router'
import { act, render } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { routeTree } from '../routeTree.gen'

const mockClientApi = {
	invite: {
		addListener: vi.fn(),
		removeListener: vi.fn(),
		emit: vi.fn(),
	},
} as unknown as MapeoClientApi

const testRouter = createRouter({
	routeTree,
	context: {},
	history: createMemoryHistory({
		initialEntries: ['/Onboarding/CreateJoinProjectScreen'],
	}),
})

test('invite listener responds to invite-received', () => {
	render(
		<ClientApiProvider clientApi={mockClientApi}>
			<RouterProvider router={testRouter} />
		</ClientApiProvider>,
	)

	act(() => {
		mockClientApi.invite.emit('invite-received', {
			inviteId: 'test-invite-id',
			projectName: 'Mock Project',
			receivedAt: Date.now(),
			projectInviteId: 'test-project-invite-id',
			invitorName: 'Test Inviter',
		})
	})

	expect(testRouter.state.location.pathname).toEqual(
		'/Onboarding/JoinProjectScreen/test-invite-id',
	)
})
