// TODO: Implement useful logger things
class Logger {
	/**
	 * @param  {...any} args
	 */
	info(...args) {
		console.log(...args)
	}
	/**
	 * @param  {...any} args
	 */
	error(...args) {
		if (args[0] instanceof Error) {
			console.error(args[0].message)
		} else {
			console.error(...args)
		}
	}
	/**
	 * @param  {...any} args
	 */
	warn(...args) {
		console.warn(...args)
	}
	/**
	 * @param {...any} args
	 */
	debug(...args) {
		const [first, ...rest] = args
		console.log(`DEBUG:${first}`, ...rest)
	}
}

export const logger = new Logger()
