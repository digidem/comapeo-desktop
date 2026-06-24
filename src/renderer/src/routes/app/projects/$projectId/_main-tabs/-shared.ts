import type { Observation, Preset, Track } from '@comapeo/core/schema.js'
import {
	isAfter,
	isBefore,
	isEqual,
	startOfDay,
	startOfMonth,
	subDays,
} from 'date-fns'
import * as v from 'valibot'

import type { DateFilter } from '../../../../../lib/local-storage.ts'

export const HighlightedDocumentSchema = v.object({
	type: v.union([v.literal('observation'), v.literal('track')]),
	docId: v.string(),
	from: v.union([v.literal('map'), v.literal('list')]),
})

export type HighlightedDocument = v.InferInput<typeof HighlightedDocumentSchema>

type DateRange = { start: Date | null; end: Date }

export function dateFilterToDateRange(
	dateFilter: DateFilter,
	now: Date,
): DateRange {
	switch (dateFilter.type) {
		case 'range': {
			return {
				start: new Date(dateFilter.start),
				end: new Date(dateFilter.end),
			}
		}
		case 'relative': {
			return {
				start: subDays(startOfDay(now), dateFilter.value),
				end: new Date(now),
			}
		}
		case 'same': {
			return { start: startOfMonth(now), end: now }
		}
	}
}

export function isDocumentIncludedByFilters(
	item: { document: Observation | Track; category?: Preset },
	filters: { categories: Array<Preset>; date?: DateRange },
) {
	if (filters.categories.length > 0) {
		const categoryIdsToInclude = new Set(filters.categories.map((c) => c.docId))

		if (!item.category?.docId) {
			return false
		}

		if (!categoryIdsToInclude.has(item.category.docId)) {
			return false
		}
	} else {
		return false
	}

	if (filters.date) {
		const { createdAt } = item.document

		const isBeforeEndDateInclusive =
			isEqual(createdAt, filters.date.end) ||
			isBefore(createdAt, filters.date.end)

		if (!isBeforeEndDateInclusive) {
			return false
		}

		if (filters.date.start) {
			const isAfterStartDateInclusive =
				isEqual(createdAt, filters.date.start) ||
				isAfter(createdAt, filters.date.start)

			if (!isAfterStartDateInclusive) {
				return false
			}
		}
	}

	return true
}

export function isEqualByItemKey<T>(a: Array<T>, b: Array<T>, field: keyof T) {
	return (
		new Set(a.map((o) => o[field])).difference(new Set(b.map((s) => s[field])))
			.size === 0
	)
}
