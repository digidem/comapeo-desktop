import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { defineMessages, FormattedMessage } from 'react-intl'

import { Button } from './Button.tsx'

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

  if (status === 'pending') return <span>Loading...</span>
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <h1></h1>
      <Button
        onClick={() => addObservationMutation.mutate('andrew')}
        customColor="ComapeoBlue"
      >
        <FormattedMessage {...m.create} />
      </Button>
      <Button
        onClick={() => deleteObservationMutation.mutate('andrew')}
        customColor="dark"
        customVariant="text"
        size="large"
      >
        <FormattedMessage {...m.delete} />
      </Button>
      <ul>
        {data.map((observation, index) => (
          <li key={`${observation}-${index}`}>{observation}</li>
        ))}
      </ul>
    </div>
  )
}
