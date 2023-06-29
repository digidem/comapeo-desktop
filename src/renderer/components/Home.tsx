import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function Home() {
  const queryClient = useQueryClient()

  const { status, data, error } = useQuery<
    Awaited<ReturnType<typeof window.mapeo.getObservations>>,
    Error
  >({
    queryKey: ['observations'],
    queryFn: () => window.mapeo.getObservations(),
  })

  const addObservationMutation = useMutation(window.mapeo.createObservation, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] })
    },
  })

  const deleteObservationMutation = useMutation(
    window.mapeo.deleteObservation,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['observations'] })
      },
    }
  )

  if (status === 'loading') return <span>Loading...</span>
  if (status === 'error') return <span>Error: {error.message}</span>

  return (
    <div>
      <button onClick={() => addObservationMutation.mutate('andrew')}>
        Create
      </button>
      <button onClick={() => deleteObservationMutation.mutate('andrew')}>
        Delete
      </button>
      <ul>
        {data.map((observation, index) => (
          <li key={`${observation}-${index}`}>{observation}</li>
        ))}
      </ul>
    </div>
  )
}
