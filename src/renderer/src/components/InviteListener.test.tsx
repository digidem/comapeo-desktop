import React from 'react'
import { ClientApiProvider } from '@comapeo/core-react'
import type { invite as Invite, MapeoClientApi } from '@comapeo/ipc'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	RouterProvider,
	createMemoryHistory,
	createRouter,
} from '@tanstack/react-router'
import { act, render } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { expect, test, vi } from 'vitest'

import { routeTree } from '../routeTree.gen'

type InviteEventHandler = (invite: Invite) => void

let inviteReceivedHandler: ((invite: InviteEventHandler) => void) | undefined

const mockInvite = {
	addListener: vi.fn(
		(event: string, handler: (invite: InviteEventHandler) => void) => {
			if (event === 'invite-received') {
				inviteReceivedHandler = handler
			}
		},
	),
	removeListener: vi.fn(
		(event: string, handler: (invite: InviteEventHandler) => void) => {
			if (event === 'invite-received' && inviteReceivedHandler === handler) {
				inviteReceivedHandler = undefined
			}
		},
	),
	emit: vi.fn((event: string, data: InviteEventHandler) => {
		if (event === 'invite-received' && inviteReceivedHandler) {
			inviteReceivedHandler(data)
		}
	}),
	getPending: vi.fn(async () => {
		return []
	}),
}

const mockClientApi = {
	invite: mockInvite,
} as unknown as MapeoClientApi
const queryClient = new QueryClient()
const testRouter = createRouter({
	routeTree,
	context: {},
	history: createMemoryHistory({
		initialEntries: ['/Onboarding/CreateJoinProjectScreen'],
	}),
})

function setup() {
	return render(
		<IntlProvider locale="en">
			<QueryClientProvider client={queryClient}>
				<ClientApiProvider clientApi={mockClientApi}>
					<RouterProvider router={testRouter} />
				</ClientApiProvider>
			</QueryClientProvider>
		</IntlProvider>,
	)
}

test('invite listener responds to invite-received', () => {
	setup()
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
