import type { Observation, Track } from '@comapeo/schema'

export const mockObservations: Observation[] = [
	{
		schemaName: 'observation',
		docId: 'obs-001',
		originalVersionId: 'ver-obs-001',
		createdAt: '2024-12-15T14:12:00.000Z',
		lat: 10.123,
		lon: -55.987,
		attachments: [],
		tags: {
			category: 'Oil Spill',
		},
		metadata: {},
		presetRef: {
			docId: 'preset-001',
			versionId: 'ver-preset-001',
		},
	},
	{
		schemaName: 'observation',
		docId: 'obs-002',
		originalVersionId: 'ver-obs-002',
		createdAt: '2024-08-08T09:35:00.000Z',
		lat: 12.345,
		lon: -56.789,
		attachments: [
			{
				driveDiscoveryId: 'drive-abc123',
				name: 'photo1.jpg',
				type: 'photo',
				hash: 'some-hash',
			},
		],
		tags: {
			category: 'Tracks sign',
		},
		metadata: {},
		presetRef: {
			docId: 'preset-002',
			versionId: 'ver-preset-002',
		},
	},
]

export const mockTracks: Track[] = [
	{
		schemaName: 'track',
		docId: 'track-001',
		originalVersionId: 'ver-track-001',
		createdAt: '2023-10-16T14:36:00.000Z',
		locations: [],
		observationRefs: [],
		tags: {
			trackName: 'Trail behind school',
		},
	},
]
