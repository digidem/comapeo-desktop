import { Box, Button, Typography, useTheme } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { defineMessages, FormattedMessage } from 'react-intl'

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
  const queryClient = useQueryClient()

  const { status, data, error } = useQuery<
    Awaited<ReturnType<typeof window.mapeo.getObservations>>,
    Error
  >({
    queryKey: ['observations'],
    queryFn: () => window.mapeo.getObservations(),
  })

  const addObservationMutation = useMutation({
    mutationFn: (name: string) => {
      return window.mapeo.createObservation(name)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] })
    },
  })

  const deleteObservationMutation = useMutation({
    mutationFn: (name: string) => {
      return window.mapeo.deleteObservation(name)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] })
    },
  })

  if (status === 'pending') return <Typography>Loading...</Typography>
  if (status === 'error') return <Typography>Error: {error.message}</Typography>

  return (
    <Box p={theme.spacing(8)}>
      <Typography variant="h1" gutterBottom>
        Observations
      </Typography>
      <Box mb={theme.spacing(8)}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => addObservationMutation.mutate('andrew')}
          sx={{ marginRight: theme.spacing(16) }}
        >
          <FormattedMessage {...m.create} />
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => deleteObservationMutation.mutate('andrew')}
        >
          <FormattedMessage {...m.delete} />
        </Button>
      </Box>
      <Box>
        <ul>
          {data?.map((observation, index) => (
            <li key={`${observation}-${index}`}>
              <Typography variant="body1">{observation}</Typography>
            </li>
          ))}
        </ul>
      </Box>
    </Box>
  )
}
