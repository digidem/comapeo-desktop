export class OneAtATimeQueue {
	#queue: Array<() => Promise<void>> = []
	#isProcessing = false

	add(fn: () => Promise<void>) {
		this.#queue.push(fn)
		this.#processQueue()
	}

	#processQueue() {
		if (this.#isProcessing) return

		const callback = this.#queue.shift()
		if (!callback) return

		this.#isProcessing = true
		callback().finally(() => {
			this.#isProcessing = false
			this.#processQueue()
		})
	}
}
