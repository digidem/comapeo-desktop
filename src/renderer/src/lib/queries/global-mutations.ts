import type { MutationKey } from '@tanstack/react-query'

const GLOBAL_MUTATIONS_BASE = 'global-mutations' as const

export const GLOBAL_MUTATIONS_BASE_KEY = [GLOBAL_MUTATIONS_BASE] as const

export function createGlobalMutationsKey(
	otherKeyParts: Array<unknown>,
): MutationKey {
	return [GLOBAL_MUTATIONS_BASE, ...otherKeyParts]
}
