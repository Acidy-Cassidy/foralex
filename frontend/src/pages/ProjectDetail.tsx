import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import MediaGallery from '../components/MediaGallery'
import LoadingSpinner from '../components/LoadingSpinner'

interface Project {
  id: string
  name: string
  description: string | null
  address: string | null
  createdAt: string
  media: MediaItem[]
}

interface MediaItem {
  id: string
  fileType: string
  filePath: string
  thumbnailPath: string | null
  latitude: number | null
  longitude: number | null
  capturedAt: string | null
  uploadedAt: string
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Project not found</p>
        <Link to="/projects" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
          Back to Projects
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/projects"
          className="text-indigo-600 hover:text-indigo-700 text-sm mb-4 inline-block"
        >
          ← Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="text-gray-600 mt-2">{project.description}</p>
        )}
        {project.address && (
          <p className="text-gray-500 text-sm mt-1">{project.address}</p>
        )}
      </div>

      <div className="mb-4">
        <Link
          to={`/capture?projectId=${project.id}`}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-block"
        >
          Add Photo/Video
        </Link>
      </div>

      <MediaGallery media={project.media} projectId={project.id} />
    </div>
  )
}
