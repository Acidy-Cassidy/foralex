import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

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

interface MediaGalleryProps {
  media: MediaItem[]
  projectId: string
}

export default function MediaGallery({ media, projectId }: MediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      await api.delete(`/media/${mediaId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setSelectedMedia(null)
    },
  })

  const getMediaUrl = (mediaItem: MediaItem, useThumbnail = false) => {
    const path = useThumbnail && mediaItem.thumbnailPath
      ? mediaItem.thumbnailPath
      : mediaItem.filePath
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/media/${mediaItem.id}/${useThumbnail ? 'thumbnail' : 'file'}`
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">No media items yet. Capture your first photo!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            List
          </button>
        </div>
        <span className="text-sm text-gray-500">{media.length} items</span>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedMedia(item)}
            >
              {item.fileType === 'photo' ? (
                <img
                  src={getMediaUrl(item, true)}
                  alt="Media"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Video</span>
                </div>
              )}
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">
                  {new Date(item.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow p-4 flex gap-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedMedia(item)}
            >
              {item.fileType === 'photo' ? (
                <img
                  src={getMediaUrl(item, true)}
                  alt="Media"
                  className="w-24 h-24 object-cover rounded"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Video</span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-500">
                  {new Date(item.uploadedAt).toLocaleString()}
                </p>
                {item.latitude && item.longitude && (
                  <p className="text-xs text-gray-400 mt-1">
                    {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedMedia(null)
            }
          }}
          tabIndex={0}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-semibold">
                {new Date(selectedMedia.uploadedAt).toLocaleString()}
              </h3>
              <div className="flex gap-2">
                {selectedMedia.latitude && selectedMedia.longitude && (
                  <span className="text-sm text-gray-600">
                    {selectedMedia.latitude.toFixed(6)}, {selectedMedia.longitude.toFixed(6)}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this media?')) {
                      deleteMutation.mutate(selectedMedia.id)
                    }
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              {selectedMedia.fileType === 'photo' ? (
                <img
                  src={getMediaUrl(selectedMedia, false)}
                  alt="Media"
                  className="max-w-full h-auto cursor-zoom-in"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <video
                  src={getMediaUrl(selectedMedia, false)}
                  controls
                  className="max-w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              {selectedMedia.latitude && selectedMedia.longitude && (
                <div className="mt-4 h-64">
                  <MapContainer
                    center={[selectedMedia.latitude, selectedMedia.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[selectedMedia.latitude, selectedMedia.longitude]}>
                      <Popup>
                        Photo location
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
