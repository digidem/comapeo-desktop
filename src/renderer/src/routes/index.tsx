import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	beforeLoad: () => {
		// TODO: Ideally navigate to the specific project page if last viewed page before app close
		// is a project-specific page
		throw Route.redirect({ to: '/app', replace: true })
	},
})
