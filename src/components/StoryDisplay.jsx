import React from 'react'

function StoryDisplay({ story, loading, fragmentCount, onRegenerate }) {
  return (
    <section className="mb-12">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              📖 La Historia Colectiva
            </h2>
            <p className="text-sm text-gray-600">
              Generada automáticamente con {fragmentCount} fragmentos de la comunidad
            </p>
          </div>
          
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            🔄 {loading ? 'Generando...' : 'Regenerar'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">La historia se está generando...</p>
            </div>
          </div>
        ) : story ? (
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
              {story}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              Aún no hay fragmentos para crear una historia.
            </p>
            <p className="text-gray-500">
              ¡Sé el primero en escribir un fragmento y comenzar la historia colectiva!
            </p>
          </div>
        )}
      </div>

      {story && !loading && (
        <div className="mt-4 text-center text-sm text-gray-500">
          💡 Cada vez que alguien agrega un fragmento, la historia se regenera automáticamente
        </div>
      )}
    </section>
  )
}
export default StoryDisplay
