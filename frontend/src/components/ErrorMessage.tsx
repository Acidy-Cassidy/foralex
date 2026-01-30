interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
}

export default function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-0 right-0 px-4 py-3 text-red-700 hover:text-red-900"
        >
          ✕
        </button>
      )}
    </div>
  )
}
