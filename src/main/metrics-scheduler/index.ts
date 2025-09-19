import { beginningOfMonthUtc, formatIsoUtc, parseIsoUtc } from './lib/date.ts'
import { OneAtATimeQueue } from './lib/one-at-a-time-queue.ts'
import { maxBy } from './lib/utils.ts'

export type RequiredReportFields = { dateGenerated: string }

export type Report<Data> = RequiredReportFields & Data

export type Queue<Data = unknown> = {
	/** An ISO date, such as `2012-03-04`, for the newest report successfully sent. */
	highWatermark?: string
	reports: Array<Report<Data>>
}

export type StorageAdaptor<Data = unknown> = {
	get: () => Promise<Queue<Data> | undefined> | undefined
	set: (queue: Queue<Data>) => Promise<void> | void
	remove: () => Promise<void> | void
}

export type Options<Data = unknown> = {
	// NOTE: Must be listed first in order for type inference of `Data` to cascade to other fields
	/**
	 * @returns The data to include in the report.
	 */
	getData: () => Promise<Data> | Data
	/**
	 * @returns Resolves with boolean indicating if the sending was executed or
	 *   not.
	 */
	sendReport: (report: Report<Data>) => Promise<boolean>
	/**
	 * Storage adaptor for the reports queue.
	 */
	storage: StorageAdaptor<Data>
}

export class MetricsScheduler<Data> {
	#updateQueue = new OneAtATimeQueue()
	#periodicCheckIntervalId: NodeJS.Timeout | undefined
	#isEnabled = false

	#getData
	#sendReport
	#storage

	constructor(options: Options<Data>) {
		this.#getData = options.getData
		this.#sendReport = options.sendReport
		this.#storage = options.storage
	}

	async #doUpdate() {
		if (!this.#isEnabled) {
			await this.#storage.remove()
			return
		}

		let queue = await this.#storage.get()

		if (!queue) {
			queue = { reports: [] }
		}

		const now = new Date()

		const numberOfReportsBeforeTruncation = queue.reports.length

		queue = truncateReportsByTime(queue, now)

		const numberOfReportsAfterTruncation = queue.reports.length

		let hasChangedQueue =
			numberOfReportsBeforeTruncation !== numberOfReportsAfterTruncation

		if (!hasReportForToday(queue)) {
			const data = await this.#getData()

			const reportToAdd = { ...data, dateGenerated: formatIsoUtc(new Date()) }

			queue = { ...queue, reports: [...queue.reports, reportToAdd] }

			hasChangedQueue = true
		}

		if (hasChangedQueue) {
			await this.#storage.set(queue)
		}

		const newestReport = queue.reports[queue.reports.length - 1]

		const shouldSendMetrics = this.#isEnabled && !!newestReport

		if (!shouldSendMetrics) {
			return
		}

		const newestReportDate = parseIsoUtc(newestReport.dateGenerated)

		if (!newestReportDate) {
			throw new Error('Expected report to be generated')
		}

		// TODO: Do we need to catch the error and no-op here?
		const reportIsSent = await this.#sendReport(newestReport)

		if (reportIsSent) {
			queue = updateQueueHighWatermark(queue)
			await this.#storage.set(queue)
		}
	}

	#scheduleUpdate() {
		this.#updateQueue.add(() => this.#doUpdate())
	}

	setEnabled(isEnabled: boolean) {
		this.#isEnabled = isEnabled

		if (isEnabled) {
			if (this.#periodicCheckIntervalId) {
				return
			}

			clearInterval(this.#periodicCheckIntervalId)

			this.#periodicCheckIntervalId = setInterval(
				this.#scheduleUpdate,
				// 5 minutes
				5 * 1000 * 60,
			)
		} else {
			clearInterval(this.#periodicCheckIntervalId)

			this.#periodicCheckIntervalId = undefined
		}

		this.#scheduleUpdate()
	}
}

function truncateReportsByTime<T>(
	queue: Queue<T>,
	now: Readonly<Date>,
): Queue<T> {
	const today = formatIsoUtc(now)
	const oldest = formatIsoUtc(beginningOfMonthUtc(now))
	return {
		...queue,
		reports: queue.reports.filter(
			({ dateGenerated }) => dateGenerated >= oldest && dateGenerated <= today,
		),
	}
}

function hasReportForToday<T>({ highWatermark, reports }: Queue<T>): boolean {
	const today = formatIsoUtc(new Date())

	const hasAlreadySentForToday = !!highWatermark && highWatermark >= today
	if (hasAlreadySentForToday) return true

	// The "or future" part could happen if the user changes their device clock to
	// the past.
	const hasReportForTodayOrFuture = reports.some(
		(report) => report.dateGenerated >= today,
	)
	if (hasReportForTodayOrFuture) return true

	return false
}

function updateQueueHighWatermark<T>(queue: Queue<T>): Queue<T> {
	const newestReport = maxBy(queue.reports, (report) => report.dateGenerated)

	const highWatermark =
		newestReport?.dateGenerated ||
		queue.highWatermark ||
		formatIsoUtc(new Date())

	return { highWatermark, reports: [] }
}
