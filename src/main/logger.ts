// TODO: Implement useful logger things
class Logger {
  info(...args: unknown[]) {
    console.log(...args)
  }
  error(...args: unknown[]) {
    if (args[0] instanceof Error) {
      console.error(args[0].message)
    } else {
      console.error(...args)
    }
  }
  warn(...args: unknown[]) {
    console.warn(...args)
  }
  debug(first: string, ...rest: unknown[]) {
    console.log(`DEBUG:${first}`, ...rest)
  }
}

export const logger = new Logger()
