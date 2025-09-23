import { beginningOfMonthUtc, formatIsoUtc } from './lib/date.ts'
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
	get: () => Promise<Queue<Data> | undefined> | (Queue<Data> | undefined)
	set: (queue: Queue<Data>) => Promise<void> | void
	remove: () => Promise<void> | void
}

export type Options<Data = unknown> = {
	// NOTE: Must be listed first in order for type inference of `Data` to cascade to other fields
	/**
	 * @returns Generate data to include in the report.
	 */
	generateData: () => Promise<Data> | Data
	/**
	 * Implementation for sending the report.
	 *
	 * @returns Boolean indicating if the sending succeeded or not.
	 */
	send: (reports: Array<Report<Data>>) => Promise<boolean>
	/**
	 * The interval (in milliseconds) at which to schedule sending.
	 */
	sendInterval: number
	/**
	 * Storage adaptor for the reports queue.
	 */
	storage: StorageAdaptor<Data>
}

export class MetricsScheduler<Data> {
	#isEnabled = false
	#periodicCheckIntervalId: NodeJS.Timeout | undefined
	#scheduleUpdate
	#updateQueue = new OneAtATimeQueue()

	#generateData
	#send
	#sendInterval
	#storage

	constructor(options: Options<Data>) {
		this.#generateData = options.generateData
		this.#send = options.send
		this.#storage = options.storage
		this.#sendInterval = options.sendInterval

		this.#scheduleUpdate = () => {
			this.#updateQueue.add(() => this.#doUpdate())
		}
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
			const data = await this.#generateData()

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

		const reportsSent = await this.#send(queue.reports)

		if (reportsSent) {
			queue = updateQueueHighWatermark(queue)
			await this.#storage.set(queue)
		}
	}

	setEnabled(isEnabled: boolean) {
		this.#isEnabled = isEnabled

		if (isEnabled) {
			if (this.#periodicCheckIntervalId) {
				return
			}

			this.#periodicCheckIntervalId = setInterval(
				this.#scheduleUpdate,
				this.#sendInterval,
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
