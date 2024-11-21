import { Box, Grid2 as Grid, useTheme } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { FormattedMessage, defineMessages } from 'react-intl'

import { Button } from '../components/Button'
import { Text } from '../components/Text'
import { useAllProjects, useCreateProject } from '../queries/projects'

export const Route = createFileRoute('/Map')({ component: Map })

const m = defineMessages({
	create: {
		id: 'create',
		defaultMessage: 'Create',
	},
	delete: {
		id: 'delete',
		defaultMessage: 'Delete',
	},
})

export function Map() {
	const theme = useTheme()
	const allProjectsQuery = useAllProjects()
	const createProjectMutation = useCreateProject()

	if (allProjectsQuery.status === 'pending') return <Text>Loading...</Text>
	if (allProjectsQuery.status === 'error')
		return <Text>Error: {allProjectsQuery.error.message}</Text>

	return (
		<div>
			<Text kind="title" italic>
				CoMapeo Desktop
			</Text>
			<Text kind="subtitle" style={{ margin: 10 }} underline>
				An Awana Digital Product
			</Text>
			<Grid container alignItems="center" spacing={2} wrap="nowrap">
				<Grid>
					<Button
						name="create-project"
						onClick={() =>
							createProjectMutation.mutate(`project-${Date.now()}`)
						}
					>
						<FormattedMessage {...m.create} />
					</Button>
				</Grid>
				<Grid>
					<Button variant="outlined" color="secondary">
						An Outlined Button!
					</Button>
				</Grid>
				<Grid>
					<Button variant="text" color="success">
						A Typography Button!
					</Button>
				</Grid>
				<Grid>
					<Button style={{ backgroundColor: theme.palette.primary.dark }}>
						Style override
					</Button>
				</Grid>
			</Grid>
			<Box mt={2}>
				<Grid container spacing={2}>
					<Grid size={{ xs: 12 }}>
						<Button
							size="fullWidth"
							color="success"
							variant="contained"
							onClick={() => alert('Full Width Button Clicked')}
						>
							Full Width Button
						</Button>
					</Grid>
				</Grid>
			</Box>
			<Box mt={2}>
				<ul>
					{allProjectsQuery.data.map((project) => (
						<li key={project.projectId}>
							<Text bold>{project.name || 'No name'}</Text>
						</li>
					))}
				</ul>
			</Box>
		</div>
	)
}
