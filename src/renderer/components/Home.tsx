import { Box, Grid, Typography, useTheme } from '@mui/material'
import { defineMessages, FormattedMessage } from 'react-intl'

import { useAllProjects, useCreateProject } from '../queries/projects'
import { Button } from './sharedComponents/Button'

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
    <div>
      <Typography variant="h1" gutterBottom>
        CoMapeo Desktop
      </Typography>
      <Grid container alignItems="center" spacing={2} wrap="nowrap">
        <Grid item>
          <Button
            name="create-project"
            onClick={() =>
              createProjectMutation.mutate(`project-${Date.now()}`)
            }
          >
            <FormattedMessage {...m.create} />
          </Button>
        </Grid>
        <Grid item>
          <Button variant="outlined" color="secondary">
            An Outlined Button!
          </Button>
        </Grid>
        <Grid item>
          <Button variant="text" color="success">
            A Text Button!
          </Button>
        </Grid>
        <Grid item>
          <Button sx={{ backgroundColor: theme.palette.primary.dark }}>
            Style override
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
    </div>
  )
}
