import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import KeywordForm from './components/KeywordForm'
import FragmentList from './components/FragmentList'
import StoryDisplay from './components/StoryDisplay'

function App() {
  const [view, setView] = useState('home') // 'home' o 'search'
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  
  const [newKeyword, setNewKeyword] = useState('')
  const [newContent, setNewContent] = useState('')
  const [addingFragment, setAddingFragment] = useState(false)
  
  // Estado para la historia generada por IA
  const [story, setStory] = useState('')
  const [loadingStory, setLoadingStory] = useState(false)
  const [allFragments, setAllFragments] = useState([])

  // Cargar fragmentos y generar historia al inicio
  useEffect(() => {
    loadFragmentsAndGenerateStory()
  }, [])

  async function loadFragmentsAndGenerateStory() {
    try {
      // Cargar últimos 20 fragmentos
      const { data, error: fetchError } = await supabase
        .from('fragments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (fetchError) throw fetchError
      
      setAllFragments(data || [])
      
      // Generar historia con IA si hay fragmentos
      if (data && data.length > 0) {
        await generateStoryFromFragments(data)
      }
    } catch (err) {
      console.error('Error cargando fragmentos:', err)
    }
  }

  async function generateStoryFromFragments(fragments) {
    if (fragments.length === 0) return
    
    setLoadingStory(true)
    
    try {
      // Preparar los fragmentos para la IA
      const fragmentsText = fragments
        .map((f, i) => `${i + 1}. "${f.content}" (palabra clave: ${f.keyword})`)
        .join('\n')
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Eres un escritor creativo. A continuación hay fragmentos de texto escritos por diferentes personas, cada uno con su palabra clave. Tu tarea es crear UNA HISTORIA COHERENTE Y CREATIVA que conecte estos fragmentos de manera natural y fluida.

FRAGMENTOS:
${fragmentsText}

INSTRUCCIONES:
- Crea una narrativa que incorpore las IDEAS de estos fragmentos (no copies textualmente)
- La historia debe fluir naturalmente, como si fuera un cuento corto
- Puedes reinterpretar y conectar los fragmentos creativamente
- Máximo 400 palabras
- Escribe en español
- NO uses formato de lista, solo prosa narrativa
- Sé creativo y poético

Escribe la historia ahora:`
            }
          ]
        })
      })

      const data = await response.json()
      
      if (data.content && data.content[0] && data.content[0].text) {
        setStory(data.content[0].text)
      }
    } catch (err) {
      console.error('Error generando historia:', err)
      setStory('No se pudo generar la historia en este momento.')
    } finally {
      setLoadingStory(false)
    }
  }

  // Buscar fragmentos
  async function searchFragments(searchTerm) {
    if (!searchTerm.trim()) return
    
    setLoading(true)
    setError(null)
    setSearched(true)
    
    try {
      const like = `%${searchTerm.trim()}%`
      
      const { data: keywordData, error: keywordError } = await supabase
        .from('fragments')
        .select('*')
        .ilike('keyword', like)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (keywordError) throw keywordError
      
      if (keywordData && keywordData.length > 0) {
        setResults(keywordData)
      } else {
        const { data: contentData, error: contentError } = await supabase
          .from('fragments')
          .select('*')
          .ilike('content', like)
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (contentError) throw contentError
        setResults(contentData || [])
      }
    } catch (err) {
      setError('Error al buscar fragmentos: ' + err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Agregar nuevo fragmento
  async function addFragment(e) {
    e.preventDefault()
    
    const trimmedKeyword = newKeyword.trim()
    const trimmedContent = newContent.trim()
    
    if (trimmedKeyword.length < 1 || trimmedKeyword.length > 48) {
      setError('La palabra clave debe tener entre 1 y 48 caracteres')
      return
    }
    
    if (trimmedContent.length < 1 || trimmedContent.length > 500) {
      setError('El contenido debe tener entre 1 y 500 caracteres')
      return
    }
    
    setAddingFragment(true)
    setError(null)
    
    try {
      const { error: insertError } = await supabase
        .from('fragments')
        .insert([{ keyword: trimmedKeyword, content: trimmedContent }])
      
      if (insertError) throw insertError
      
      setNewKeyword('')
      setNewContent('')
      
      // Recargar fragmentos y regenerar historia
      await loadFragmentsAndGenerateStory()
      
      alert('¡Fragmento publicado! La historia se está regenerando...')
      
      // Volver al home para ver la nueva historia
      setView('home')
      setSearched(false)
    } catch (err) {
      setError('Error al agregar fragmento: ' + err.message)
    } finally {
      setAddingFragment(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    searchFragments(keyword)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Conexiones</h1>
          <p className="text-lg text-gray-600 mb-6">
            Una historia colectiva creada por IA con palabras de muchas personas
          </p>
          
          {/* Navegación */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setView('home')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                view === 'home'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🏠 Historia
            </button>
            <button
              onClick={() => setView('search')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                view === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🔍 Buscar
            </button>
          </div>
        </header>

        {/* Vista Home: Historia generada */}
        {view === 'home' && (
          <>
            <StoryDisplay 
              story={story} 
              loading={loadingStory}
              fragmentCount={allFragments.length}
              onRegenerate={loadFragmentsAndGenerateStory}
            />
            
            {/* Últimos fragmentos */}
            {allFragments.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Fragmentos recientes
                </h2>
                <FragmentList items={allFragments.slice(0, 6)} />
              </section>
            )}
          </>
        )}

        {/* Vista Search */}
        {view === 'search' && (
          <>
            <section className="mb-8">
              <KeywordForm
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onSubmit={handleSearch}
                loading={loading}
              />
            </section>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                {error}
              </div>
            )}

            {searched && (
              <section className="mb-12">
                {results.length === 0 && !loading && (
                  <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                    <p className="text-gray-600 mb-2">
                      Sin fragmentos para esta palabra.
                    </p>
                    <p className="text-gray-500">¡Escribe el primero!</p>
                  </div>
                )}
                
                {results.length > 0 && (
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      {results.length} {results.length === 1 ? 'fragmento encontrado' : 'fragmentos encontrados'}
                    </h2>
                    <FragmentList items={results} />
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* Formulario agregar (siempre visible) */}
        <section className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            ✍️ Agregar fragmento
          </h2>
          
          <form onSubmit={addFragment} className="space-y-4">
            <div>
              <label htmlFor="newKeyword" className="block text-sm font-medium text-gray-700 mb-1">
                Palabra clave (1-48 caracteres)
              </label>
              <input
                id="newKeyword"
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                maxLength={48}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: amor, tiempo, ciudad..."
                required
              />
            </div>
            
            <div>
              <label htmlFor="newContent" className="block text-sm font-medium text-gray-700 mb-1">
                Contenido (máx. 500 caracteres)
              </label>
              <textarea
                id="newContent"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Escribe tu fragmento aquí..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {newContent.length}/500 caracteres
              </p>
            </div>
            
            <button
              type="submit"
              disabled={addingFragment}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {addingFragment ? 'Publicando...' : 'Publicar y Regenerar Historia'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default App
