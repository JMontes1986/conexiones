function FragmentList({ items }) {
  // Formatear fecha de forma relativa simple
  function formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} días`
    
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((fragment) => (
        <div
          key={fragment.id}
          className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
              {fragment.keyword}
            </span>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(fragment.created_at)}
            </span>
          </div>
          
          <p className="text-gray-700 leading-relaxed">
            {fragment.content}
          </p>
        </div>
      ))}
    </div>
  )
}

export default FragmentList
