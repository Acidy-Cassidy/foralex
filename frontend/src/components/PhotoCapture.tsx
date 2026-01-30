import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import api from '../services/api'

interface PhotoCaptureProps {
  projectId: string
  onUploadSuccess?: () => void
}

export default function PhotoCapture({ projectId, onUploadSuccess }: PhotoCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)
      
      if (location) {
        formData.append('latitude', location.lat.toString())
        formData.append('longitude', location.lng.toString())
      }

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      setCapturedImage(null)
      setLocation(null)
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Upload failed')
    },
  })

  useEffect(() => {
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (err) => {
          console.error('Geolocation error:', err)
        }
      )
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError('Failed to access camera')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCapturedImage(dataUrl)
        stopCamera()
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
      uploadFile(file)
    }
  }

  const uploadFile = (file: File) => {
    uploadMutation.mutate(file)
  }

  const handleUpload = () => {
    if (capturedImage) {
      // Convert data URL to blob
      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          })
          uploadFile(file)
        })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Capture or Upload Photo/Video</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {location && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
          Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </div>
      )}

      {!stream && !capturedImage && (
        <div className="space-y-4">
          <button
            onClick={startCamera}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Start Camera
          </button>
          <div className="text-center text-gray-500">or</div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Choose File
          </button>
        </div>
      )}

      {stream && !capturedImage && (
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          <div className="flex gap-4">
            <button
              onClick={capturePhoto}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4">
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full rounded-lg"
          />
          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
            <button
              onClick={() => {
                setCapturedImage(null)
                startCamera()
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
