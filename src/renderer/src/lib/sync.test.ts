import { type SyncState } from '@comapeo/core-react'
import { describe, expect, it, test } from 'vitest'

import { deriveSyncStage, getConnectedPeersCount } from './sync'

test('getConnectedPeersCount', () => {
	const exampleDeviceSyncState: SyncState['remoteDeviceSyncState'][string] = {
		initial: { isSyncEnabled: true, want: 0, wanted: 0 },
		data: { isSyncEnabled: true, want: 0, wanted: 0 },
	}

	expect(getConnectedPeersCount({})).toBe(0)

	expect(
		getConnectedPeersCount({
			alice: exampleDeviceSyncState,
		}),
	).toBe(1)

	expect(
		getConnectedPeersCount({
			alice: exampleDeviceSyncState,
			bob: exampleDeviceSyncState,
		}),
	).toBe(2)
})

describe('deriveSyncStage', () => {
	it('returns "waiting" when progress is null', () => {
		const result = deriveSyncStage({
			progress: null,
			connectedPeersCount: 0,
			syncingPeersCount: 0,
			dataSyncEnabled: true,
		})
		expect(result).toEqual({
			name: 'waiting',
			connectedPeersCount: 0,
			syncingPeersCount: 0,
		})
	})

	it('returns "waiting" when data sync is enabled and no peers are connected', () => {
		const result = deriveSyncStage({
			progress: 0.5,
			connectedPeersCount: 0,
			syncingPeersCount: 0,
			dataSyncEnabled: true,
		})
		expect(result).toEqual({
			name: 'waiting',
			connectedPeersCount: 0,
			syncingPeersCount: 0,
		})
	})

	it('returns "complete-full" when data sync is enabled, progress is 1, and all peers are syncing', () => {
		const result = deriveSyncStage({
			progress: 1,
			connectedPeersCount: 5,
			syncingPeersCount: 5,
			dataSyncEnabled: true,
		})
		expect(result).toEqual({
			name: 'complete-full',
			syncingPeersCount: 5,
			connectedPeersCount: 5,
			progress: 1,
		})
	})

	it('returns "complete-partial" when data sync is enabled, progress is 1, but not all peers are syncing', () => {
		const result = deriveSyncStage({
			progress: 1,
			connectedPeersCount: 5,
			syncingPeersCount: 3,
			dataSyncEnabled: true,
		})
		expect(result).toEqual({
			name: 'complete-partial',
			syncingPeersCount: 3,
			connectedPeersCount: 5,
			progress: 1,
		})
	})

	it('returns "syncing" when data sync is enabled and progress is between 0 and 1', () => {
		const result = deriveSyncStage({
			progress: 0.5,
			connectedPeersCount: 5,
			syncingPeersCount: 3,
			dataSyncEnabled: true,
		})
		expect(result).toEqual({
			name: 'syncing',
			connectedPeersCount: 5,
			syncingPeersCount: 3,
			progress: 0.5,
		})
	})

	it('returns "complete-full" when data sync is disabled, progress is 1, and all peers are syncing', () => {
		const result = deriveSyncStage({
			progress: 1,
			connectedPeersCount: 5,
			syncingPeersCount: 5,
			dataSyncEnabled: false,
		})
		expect(result).toEqual({
			name: 'complete-full',
			connectedPeersCount: 5,
			syncingPeersCount: 5,
			progress: 1,
		})
	})

	it('returns "complete-partial" when data sync is disabled, progress is 1, but not all peers are syncing', () => {
		const result = deriveSyncStage({
			progress: 1,
			connectedPeersCount: 5,
			syncingPeersCount: 3,
			dataSyncEnabled: false,
		})
		expect(result).toEqual({
			name: 'complete-partial',
			connectedPeersCount: 5,
			syncingPeersCount: 3,
			progress: 1,
		})
	})

	it('returns "idle" when data sync is disabled and progress is not 1', () => {
		const result = deriveSyncStage({
			progress: 0.5,
			connectedPeersCount: 5,
			syncingPeersCount: 3,
			dataSyncEnabled: false,
		})
		expect(result).toEqual({
			name: 'idle',
			connectedPeersCount: 5,
			syncingPeersCount: 3,
		})
	})
})
