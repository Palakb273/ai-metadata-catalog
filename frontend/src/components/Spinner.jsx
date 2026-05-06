export default function Spinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 animate-fade-in" id="spinner">
      <div className={`${sizeClasses[size]} border-primary-200 border-t-primary-500 rounded-full animate-spin`} />
      {message && (
        <p className="text-sm text-surface-500 font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}
