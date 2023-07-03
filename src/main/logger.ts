// TODO: Implement useful logger things
class Logger {
  info(...args: any) {
    console.log(...args)
  }
  error(...args: any) {
    if (args[0] instanceof Error) {
      console.error(args[0].message)
    } else {
      console.error(...args)
    }
  }
  warn(...args: any) {
    console.warn(...args)
  }
  debug(first: string, ...rest: any) {
    console.log(`DEBUG:${first}`, ...rest)
  }
}

export const logger = new Logger()
