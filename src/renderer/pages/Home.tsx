import { Box, Grid, useTheme } from '@mui/material'
import { defineMessages, FormattedMessage } from 'react-intl'

import { Button } from '../components/Button'
import { Text } from '../components/Text.tsx'
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
    return <Text variant="button">Loading...</Text>
  if (allProjectsQuery.status === 'error')
    return <Text variant="button">Error: {allProjectsQuery.error.message}</Text>

  return (
    <div>
      <Text kind="title" gutterBottom>
        CoMapeo Desktop
      </Text>
      <Text
        kind="subtitle"
        style={{ color: 'tomato', marginTop: 3, marginBottom: 3 }}
      >
        An Awana Digital Product
      </Text>
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
            <Text variant="button">An Outlined Button!</Text>
          </Button>
        </Grid>
        <Grid item>
          <Button variant="text" color="success">
            <Text variant="button">A Text Button!</Text>
          </Button>
        </Grid>
        <Grid item>
          <Button sx={{ backgroundColor: theme.palette.primary.dark }}>
            <Text variant="button">Style override</Text>
          </Button>
        </Grid>
      </Grid>
      <Box mt={2}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              size="fullWidth"
              color="success"
              variant="contained"
              onClick={() => alert('Full Width Button Clicked')}
            >
              <Text variant="button">Full Width Button</Text>
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Box mt={2}>
        <ul>
          {allProjectsQuery.data.map((project) => (
            <li key={project.projectId}>
              <Text kind="body">{project.name || 'No name'}</Text>
            </li>
          ))}
        </ul>
      </Box>
    </div>
  )
}
