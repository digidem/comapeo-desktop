import { Box, Button, Typography, useTheme } from '@mui/material'
import { defineMessages, FormattedMessage } from 'react-intl'

import { useAllProjects, useCreateProject } from '../queries/projects'

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

export function Home() {
  const theme = useTheme()
  const allProjectsQuery = useAllProjects()
  const createProjectMutation = useCreateProject()

  if (allProjectsQuery.status === 'pending')
    return <Typography>Loading...</Typography>
  if (allProjectsQuery.status === 'error')
    return <Typography>Error: {allProjectsQuery.error.message}</Typography>

  return (
    <Box p={theme.spacing(8)}>
      <Typography variant="h1" gutterBottom>
        Observations
      </Typography>
      <Box mb={theme.spacing(8)}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => createProjectMutation.mutate(`project-${Date.now()}`)}
          sx={{ marginRight: theme.spacing(16) }}
        >
          <FormattedMessage {...m.create} />
        </Button>
        <Button variant="contained" color="secondary">
          A Button!
        </Button>
      </Box>
      <Box>
        <ul>
          {allProjectsQuery.data.map((project) => (
            <li key={project.projectId}>
              <Typography variant="body1">
                {project.name || 'No name'}
              </Typography>
            </li>
          ))}
        </ul>
      </Box>
    </Box>
  )
}
