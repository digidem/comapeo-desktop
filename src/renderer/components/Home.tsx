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
  const allProjectsQuery = useAllProjects()
  const createProjectMutation = useCreateProject()

  if (allProjectsQuery.status === 'pending') return <span>Loading...</span>
  if (allProjectsQuery.status === 'error')
    return <span>Error: {allProjectsQuery.error.message}</span>

  return (
    <div>
      <h1>CoMapeo Desktop</h1>

      <label htmlFor="create-project">Create project</label>
      <button
        name="create-project"
        onClick={() => createProjectMutation.mutate(`project-${Date.now()}`)}
      >
        <FormattedMessage {...m.create} />
      </button>
      <ul>
        {allProjectsQuery.data.map((project) => (
          <li key={project.projectId}>{project.name || 'No name'}</li>
        ))}
      </ul>
    </div>
  )
}
