import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

interface Project {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    media: number
  }
}

export default function Dashboard() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/capture"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Capture Photo
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-gray-600 text-sm mb-4">{project.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{project._count.media} media items</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link
              to="/projects"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first project
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
