import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import PhotoCapture from '../components/PhotoCapture'

interface Project {
  id: string
  name: string
}

export default function Capture() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('projectId')

  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      return response.data
    },
  })

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projectId || ''
  )

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId)
    }
  }, [projectId])

  const handleUploadSuccess = () => {
    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}`)
    } else {
      navigate('/')
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Capture Photo/Video</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Project *
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">Choose a project...</option>
          {projects?.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId && (
        <PhotoCapture projectId={selectedProjectId} onUploadSuccess={handleUploadSuccess} />
      )}

      {!selectedProjectId && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Please select a project to continue
        </div>
      )}
    </div>
  )
}
