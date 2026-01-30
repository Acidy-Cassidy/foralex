import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

interface Project {
  id: string
  name: string
  description: string | null
  address: string | null
  createdAt: string
  _count: {
    media: number
  }
}

interface ProjectForm {
  name: string
  description: string
  address: string
}

export default function Projects() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: ProjectForm) => {
      const response = await api.post('/projects', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setShowForm(false)
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectForm>()

  const onSubmit = (data: ProjectForm) => {
    createMutation.mutate(data)
    reset()
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                {...register('name', { required: 'Project name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter project name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter project description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                {...register('address')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter project address"
              />
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      )}

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
                <p className="text-gray-600 text-sm mb-2">{project.description}</p>
              )}
              {project.address && (
                <p className="text-gray-500 text-xs mb-4">{project.address}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{project._count.media} media items</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No projects yet. Create your first project!</p>
          </div>
        )}
      </div>
    </div>
  )
}
