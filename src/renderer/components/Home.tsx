import { Box, Button, Typography, useTheme } from '@mui/material'
import Grid from '@mui/material/Grid'
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
    <Box p={theme.spacing(6)}>
      <Typography variant="h1" gutterBottom>
        CoMapeo Desktop
      </Typography>
      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <Typography variant="h6" component="label" htmlFor="create-project">
            Create project
          </Typography>
        </Grid>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            name="create-project"
            onClick={() =>
              createProjectMutation.mutate(`project-${Date.now()}`)
            }
          >
            <FormattedMessage {...m.create} />
          </Button>
        </Grid>
        <Grid item>
          <Button variant="contained" color="secondary">
            Another Button!
          </Button>
        </Grid>
      </Grid>
      <Box mt={2}>
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
