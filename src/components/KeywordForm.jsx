import React from 'react'

function KeywordForm({ value, onChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Escribe una palabra clave..."
        className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Buscando...' : 'Conectar'}
      </button>
    </form>
  )
}

export default KeywordForm
