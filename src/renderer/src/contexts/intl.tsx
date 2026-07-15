import {
	useDeferredValue,
	useEffect,
	useMemo,
	type ComponentProps,
	type PropsWithChildren,
	type ReactNode,
} from 'react'
import {
	LocalizationProvider,
	type PickersLocaleText,
} from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import {
	queryOptions,
	useSuspenseQueries,
	useSuspenseQuery,
} from '@tanstack/react-query'
import type { Locale } from 'date-fns'
import { shake } from 'radashi'
import {
	defineMessages,
	IntlProvider as ReactIntlProvider,
	useIntl,
} from 'react-intl'

import { DEFAULT_LANGUAGE_TAG } from '../../../shared/intl.ts'
import { CORNFLOWER_BLUE, ORANGE } from '../colors.ts'
import { getLocaleStateQueryOptions } from '../lib/queries/app-settings.ts'
import { getTranslatedMessagesQueryOptions } from '../lib/queries/intl.ts'

const RICH_TEXT_MAPPINGS: ComponentProps<
	typeof ReactIntlProvider
>['defaultRichTextElements'] = {
	b: (parts) => {
		return <b>{parts}</b>
	},
	orange: (parts) => {
		return <span style={{ color: ORANGE }}>{parts}</span>
	},
	blue: (parts) => {
		return <span style={{ color: CORNFLOWER_BLUE }}>{parts}</span>
	},
	br: () => {
		return <br />
	},
}

const DATE_FN_LOCALES = import.meta.glob<Locale>(['./*.js', '!./cdn.*'], {
	base: '/../../node_modules/date-fns/locale/',
	import: 'default',
})

const MATERIAL_DATE_PICKER_LOCALES = import.meta.glob(
	['./*.mjs', '!./index.*'],
	{ base: '/../../node_modules/@mui/x-date-pickers/locales' },
)

export function IntlProvider({ children }: PropsWithChildren) {
	const { data: persistedLocale } = useSuspenseQuery({
		...getLocaleStateQueryOptions(),
		select: ({ value }) => value,
	})

	// NOTE: We always load the default language messages to use as a fallback for missing message keys
	const { data: defaultLanguageMessages } = useSuspenseQuery(
		getTranslatedMessagesQueryOptions(DEFAULT_LANGUAGE_TAG),
	)

	// NOTE: Prevents the suspense boundary from showing the fallback when we update the locale,
	// avoiding a jarring UI flicker.
	const deferredLocale = useDeferredValue(persistedLocale)

	const { data: localeMessages } = useSuspenseQuery(
		getTranslatedMessagesQueryOptions(deferredLocale),
	)

	const combinedMessages = useMemo(() => {
		return { ...defaultLanguageMessages, ...localeMessages }
	}, [defaultLanguageMessages, localeMessages])

	useEffect(
		function updateDocumentLang() {
			document.documentElement.lang = persistedLocale
		},
		[persistedLocale],
	)

	return (
		<ReactIntlProvider
			// @ts-expect-error Not worth fixing
			messages={combinedMessages}
			locale={persistedLocale}
			defaultLocale={DEFAULT_LANGUAGE_TAG}
			defaultRichTextElements={RICH_TEXT_MAPPINGS}
		>
			<DatePickersLocalizationProvider>
				{children}
			</DatePickersLocalizationProvider>
		</ReactIntlProvider>
	)
}

function DatePickersLocalizationProvider({
	children,
}: {
	children: ReactNode
}) {
	const { formatMessage: t, locale, formatters } = useIntl()

	const deferredLocale = useDeferredValue(locale)

	const dateFnLocale = useSuspenseQueries({
		queries: Array.from(new Set([deferredLocale, 'en-US'])).map((l) =>
			queryOptions({
				queryKey: ['dateFnLocale', l] as const,
				queryFn: async () => {
					const baseTag = l.split('-')[0]!

					const localePromise =
						DATE_FN_LOCALES[`./${l}.js`] || DATE_FN_LOCALES[`./${baseTag}.js`]

					return localePromise ? localePromise() : null
				},
				// Basically only want this to happen once.
				staleTime: Infinity,
				gcTime: Infinity,
			}),
		),
		combine: (queries) => {
			for (const q of queries) {
				if (q.data !== null) {
					return q.data
				}
			}

			// NOTE: Shouldn't happen
			throw new Error('All date-fn locale queries are missing data')
		},
	})

	const { data: datePickersLocaleText } = useSuspenseQuery({
		queryKey: ['datePickersLocaleText', deferredLocale],
		queryFn: async () => {
			const materialLocaleName = deferredLocale.split('-').join('')

			const datePickerLocalePromise =
				MATERIAL_DATE_PICKER_LOCALES[`./${materialLocaleName}.mjs`]

			if (!datePickerLocalePromise) {
				return null
			}

			return (
				// @ts-expect-error Not worth fixing
				(await datePickerLocalePromise())[materialLocaleName].components
					.MuiLocalizationProvider.defaultProps.localeText as PickersLocaleText
			)
		},
		// Basically only want this to happen once.
		staleTime: Infinity,
		gcTime: Infinity,
	})

	const localeText: Partial<PickersLocaleText> = useMemo(() => {
		const calendarViewSwitchingButtonAriaLabel:
			PickersLocaleText['calendarViewSwitchingButtonAriaLabel'] | undefined =
			datePickersLocaleText?.calendarViewSwitchingButtonAriaLabel
				? (view) => {
						const message =
							view === 'year'
								? m.calendarViewYearSwitchingButtonAriaLabel
								: m.calendarViewCalendarSwitchingButtonAriaLabel

						const localeTextFromMessages = getLocaleTextOverride(
							t(message),
							formatters.getMessageFormat(message.defaultMessage).format(),
						)

						return (
							localeTextFromMessages ||
							datePickersLocaleText.calendarViewSwitchingButtonAriaLabel(view)
						)
					}
				: !!getLocaleTextOverride(
							t(m.calendarViewYearSwitchingButtonAriaLabel),
							formatters
								.getMessageFormat(
									m.calendarViewYearSwitchingButtonAriaLabel.defaultMessage,
								)
								.format(),
					  ) &&
					  !!getLocaleTextOverride(
							t(m.calendarViewCalendarSwitchingButtonAriaLabel),
							formatters
								.getMessageFormat(
									m.calendarViewCalendarSwitchingButtonAriaLabel.defaultMessage,
								)
								.format(),
					  )
					? (view) =>
							t(
								view === 'year'
									? m.calendarViewYearSwitchingButtonAriaLabel
									: m.calendarViewCalendarSwitchingButtonAriaLabel,
							)
					: undefined

		const openDatePickerDialogue:
			PickersLocaleText['openDatePickerDialogue'] | undefined =
			datePickersLocaleText?.openDatePickerDialogue
				? (formattedDate) => {
						const localeTextFromMessages = formattedDate
							? getLocaleTextOverride(
									t(m.openDatePickerDialogueSelected),
									formatters
										.getMessageFormat(
											m.openDatePickerDialogueSelected.defaultMessage,
										)
										.format({ formattedDate }),
								)
							: getLocaleTextOverride(
									t(m.openDatePickerDialogue),
									formatters
										.getMessageFormat(m.openDatePickerDialogue.defaultMessage)
										.format(),
								)

						return (
							localeTextFromMessages ||
							datePickersLocaleText.openDatePickerDialogue(formattedDate)
						)
					}
				: !!getLocaleTextOverride(
							t(m.openDatePickerDialogue),
							formatters
								.getMessageFormat(m.openDatePickerDialogue.defaultMessage)
								.format(),
					  ) &&
					  !!getLocaleTextOverride(
							t(m.openDatePickerDialogueSelected),
							formatters
								.getMessageFormat(
									m.openDatePickerDialogueSelected.defaultMessage,
								)
								.format(),
					  )
					? (formattedDate) =>
							formattedDate
								? t(m.openDatePickerDialogueSelected, { formattedDate })
								: t(m.openDatePickerDialogue)
					: undefined

		const appOverrides = shake({
			// Calendar navigation
			previousMonth: getLocaleTextOverride(
				t(m.previousMonth),
				formatters.getMessageFormat(m.previousMonth.defaultMessage).format(),
			),
			nextMonth: getLocaleTextOverride(
				t(m.nextMonth),
				formatters.getMessageFormat(m.nextMonth.defaultMessage).format(),
			),
			// View navigation
			openPreviousView: getLocaleTextOverride(
				t(m.openPreviousView),
				formatters.getMessageFormat(m.openPreviousView.defaultMessage).format(),
			),
			calendarViewSwitchingButtonAriaLabel,
			// Open picker labels
			openDatePickerDialogue,
			fieldClearLabel: getLocaleTextOverride(
				t(m.fieldClearLabel),
				formatters.getMessageFormat(m.fieldClearLabel.defaultMessage).format(),
			),
			// View names,
			year: getLocaleTextOverride(
				t(m.year),
				formatters.getMessageFormat(m.year.defaultMessage).format(),
			),
			month: getLocaleTextOverride(
				t(m.month),
				formatters.getMessageFormat(m.month.defaultMessage).format(),
			),
			day: getLocaleTextOverride(
				t(m.day),
				formatters.getMessageFormat(m.day.defaultMessage).format(),
			),
			weekDay: getLocaleTextOverride(
				t(m.weekDay),
				formatters.getMessageFormat(m.weekDay.defaultMessage).format(),
			),
			hours: getLocaleTextOverride(
				t(m.hours),
				formatters.getMessageFormat(m.hours.defaultMessage).format(),
			),
			minutes: getLocaleTextOverride(
				t(m.minutes),
				formatters.getMessageFormat(m.minutes.defaultMessage).format(),
			),
			seconds: getLocaleTextOverride(
				t(m.seconds),
				formatters.getMessageFormat(m.seconds.defaultMessage).format(),
			),
			meridiem: getLocaleTextOverride(
				t(m.meridiem),
				formatters.getMessageFormat(m.meridiem.defaultMessage).format(),
			),
			// Common
			empty: getLocaleTextOverride(
				t(m.empty),
				formatters.getMessageFormat(m.empty.defaultMessage).format(),
			),
		})

		return { ...datePickersLocaleText, ...appOverrides }
	}, [t, formatters, datePickersLocaleText])

	return (
		<LocalizationProvider
			dateAdapter={AdapterDateFns}
			adapterLocale={dateFnLocale}
			localeText={localeText}
		>
			{children}
		</LocalizationProvider>
	)
}

function getLocaleTextOverride(
	formattedRenderedMessage: string,
	formattedDefaultMessage: unknown,
) {
	if (formattedRenderedMessage === formattedDefaultMessage) {
		return undefined
	}

	return formattedRenderedMessage
}

// NOTE: Defaults come from https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/locales/enUS.ts
const m = defineMessages({
	// Calendar navigation
	previousMonth: {
		id: 'intl.date-pickers.previousMonth',
		defaultMessage: 'Previous month',
		description:
			'Accessible label for button to navigate to previous month in date picker calendar view.',
	},
	nextMonth: {
		id: 'intl.date-pickers.nextMonth',
		defaultMessage: 'Next month',
		description:
			'Accessible label for button to navigate to next month in date picker calendar view.',
	},
	// View navigation
	openPreviousView: {
		id: 'intl.date-pickers.openPreviousView',
		defaultMessage: 'Open previous view',
		description:
			'Accessible label for button to open previous view in date picker.',
	},
	openNextView: {
		id: 'intl.date-pickers.openNextView',
		defaultMessage: 'Open next view',
		description:
			'Accessible label for button to open next view in date picker.',
	},
	calendarViewYearSwitchingButtonAriaLabel: {
		id: 'intl.date-pickers.calendarViewYearSwitchingButtonAriaLabel',
		defaultMessage: 'year view is open, switch to calendar view',
		description:
			'Accessible label for button to switch from year view to calendar view in date picker.',
	},
	calendarViewCalendarSwitchingButtonAriaLabel: {
		id: 'intl.date-pickers.calendarViewCalendarSwitchingButtonAriaLabel',
		defaultMessage: 'calendar view is open, switch to year view',
		description:
			'Accessible label for button to switch from calendar view to year view in date picker.',
	},
	// Open Picker labels
	openDatePickerDialogue: {
		id: 'intl.date-pickers.openDatePickerDialogue',
		defaultMessage: 'Choose date',
		description:
			'Accessible label for open date picker dialogue in date picker.',
	},
	openDatePickerDialogueSelected: {
		id: 'intl.date-pickers.openDatePickerDialogueSelected',
		defaultMessage: 'Choose date, selected date is {formattedDate}',
		description:
			'Accessible label for open date picker dialogue with selected date in date picker.',
	},
	fieldClearLabel: {
		id: 'intl.date-pickers.fieldClearLabel',
		defaultMessage: 'Clear',
		description: 'Accessible label for button to clear the date picker input.',
	},
	// View names
	year: {
		id: 'intl.date-pickers.year',
		defaultMessage: 'Year',
		description: 'Name of the year view in date picker.',
	},
	month: {
		id: 'intl.date-pickers.month',
		defaultMessage: 'Month',
		description: 'Name of the month view in date picker.',
	},
	day: {
		id: 'intl.date-pickers.day',
		defaultMessage: 'Day',
		description: 'Name of the day view in date picker.',
	},
	weekDay: {
		id: 'intl.date-pickers.weekDay',
		defaultMessage: 'Week day',
		description: 'Name of the week day view in date picker.',
	},
	hours: {
		id: 'intl.date-pickers.hours',
		defaultMessage: 'Hours',
		description: 'Name of the hours view in date picker.',
	},
	minutes: {
		id: 'intl.date-pickers.minutes',
		defaultMessage: 'Minutes',
		description: 'Name of the minutes view in date picker.',
	},
	seconds: {
		id: 'intl.date-pickers.seconds',
		defaultMessage: 'Seconds',
		description: 'Name of the seconds view in date picker.',
	},
	meridiem: {
		id: 'intl.date-pickers.meridiem',
		defaultMessage: 'Meridiem',
		description: 'Name of the meridiem view in date picker.',
	},
	// Common
	empty: {
		id: 'intl.date-pickers.empty',
		defaultMessage: 'Empty',
		description: 'Label for empty state in date picker.',
	},
})
