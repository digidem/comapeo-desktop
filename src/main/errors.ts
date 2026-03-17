export class AppRunError extends Error {
	title: string
	description: string

	constructor({
		title,
		description,
		...errorOptions
	}: ErrorOptions & { title: string; description: string }) {
		super('App run error occurred', errorOptions)
		this.name = 'AppRunError'
		this.title = title
		this.description = description
	}
}
