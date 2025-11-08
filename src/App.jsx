import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { getSupabaseClient, isSupabaseConfigured } from './lib/supabaseClient'
import KeywordForm from './components/KeywordForm'
import FragmentList from './components/FragmentList'
import StoryDisplay from './components/StoryDisplay'

const STORY_INTRO =
  'Esta historia colectiva narra un recorrido construido con los fragmentos más recientes:'

function App() {
  const supabaseConfigured = isSupabaseConfigured()
  const supabaseClient = useMemo(
    () => (supabaseConfigured ? getSupabaseClient() : null),
    [supabaseConfigured]
  )
  
  const [view, setView] = useState('home') // 'home' o 'search'
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  
  const [newKeyword, setNewKeyword] = useState('')
  const [newContent, setNewContent] = useState('')
  const [addingFragment, setAddingFragment] = useState(false)
  
  // Estado para la historia generada automáticamente
  const [story, setStory] = useState('')
  const [loadingStory, setLoadingStory] = useState(false)
  const [allFragments, setAllFragments] = useState([])
  const [storyFragments, setStoryFragments] = useState([])

  const createStoryText = useCallback(
    (fragments) => {
      if (!fragments || fragments.length === 0) {
        return ''
      }

      const connectors = [
        'Iniciamos el recorrido en',
        'Continuamos hacia',
        'El camino nos conduce a',
        'Más adelante exploramos',
        'Seguimos descubriendo',
        'Finalmente llegamos a'
      ]

      const journeySegments = fragments.map((fragment, index) => {
        const connector = connectors[index] || 'Luego visitamos'
        const keywordPart = fragment.keyword ? ` ${fragment.keyword}` : ''
        const content = fragment.content.trim()

        return `${connector}${keywordPart ? keywordPart : ''}. ${content}`
      })

      return [STORY_INTRO, '', ...journeySegments].join('\n\n')
    },
    []
  )

  const loadFragments = useCallback(async () => {
    if (!supabaseClient) {
      setStory('Configura las variables de entorno de Supabase para ver la historia generada automáticamente.')
      setStoryFragments([])
      setAllFragments([])
      return
    }

    setLoadingStory(true)
    
    try {
      const { data, error: fetchError } = await supabaseClient
        .from('fragments')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(20)
      
      if (fetchError) throw fetchError
      
      const fragments = data || []
      setStoryFragments(fragments)
      setStory(createStoryText(fragments))
      setAllFragments([...fragments].reverse())
    } catch (err) {
      console.error('Error cargando fragmentos:', err)
      setStory('No se pudo cargar la historia en este momento.')
      setStoryFragments([])
    } finally {
      setLoadingStory(false)
    }
  }, [createStoryText, supabaseClient])

  const appendFragment = useCallback(
    (newFragment) => {
      if (!newFragment) return

      setStoryFragments((prev) => {
        if (prev.some((fragment) => fragment.id === newFragment.id)) {
          return prev
        }

        const updated = [...prev, newFragment]
        const limited = updated.slice(-20)
        setStory(createStoryText(limited))
        return limited
      })

      setAllFragments((prev) => {
        if (prev.some((fragment) => fragment.id === newFragment.id)) {
          return prev
        }

        const updated = [newFragment, ...prev]
        return updated.slice(0, 20)
      })
    },
    [createStoryText]
  )

  // Cargar fragmentos al inicio
  useEffect(() => {
    if (!supabaseConfigured) {
      setStory('Configura las variables de entorno de Supabase para ver la historia generada automáticamente.')
      setStoryFragments([])
      setAllFragments([])
      return
    }

    loadFragments()
  }, [loadFragments, supabaseConfigured])

  useEffect(() => {
    if (!supabaseClient) return

    const channel = supabaseClient
      .channel('fragments-live-updates')
     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fragments' }, (payload) => {
        appendFragment(payload.new)
      })
      .subscribe()

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel)
      }
    }
  }, [appendFragment, supabaseClient])
  
  // Buscar fragmentos
  async function searchFragments(searchTerm) {
    if (!searchTerm.trim()) return

    if (!supabaseConfigured) {
      setError('La aplicación no está configurada con Supabase. Agrega las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para habilitar las búsquedas.')
      return
    }
    
    setLoading(true)
    setError(null)
    setSearched(true)
    
    try {
      const like = `%${searchTerm.trim()}%`
      
      const { data: keywordData, error: keywordError } = await supabaseClient
        .from('fragments')
        .select('*')
        .ilike('keyword', like)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (keywordError) throw keywordError
      
      if (keywordData && keywordData.length > 0) {
        setResults(keywordData)
      } else {
        const { data: contentData, error: contentError } = await supabaseClient
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
    
    if (!supabaseConfigured) {
      setError('No es posible publicar fragmentos sin configurar Supabase.')
      return
    }
    
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
      const { data: insertedFragment, error: insertError } = await supabaseClient
        .from('fragments')
        .insert([{ keyword: trimmedKeyword, content: trimmedContent }])
        .select()
        .single()
      
      if (insertError) throw insertError

      appendFragment(insertedFragment)
      
      setNewKeyword('')
      setNewContent('')
      
      alert('¡Fragmento publicado! La historia se actualizará automáticamente.')
      
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

  return !supabaseConfigured ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-xl bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Conexiones</h1>
        <p className="text-gray-700 mb-4">
          La aplicación necesita configurarse con Supabase para cargar y crear fragmentos.
        </p>
        <p className="text-gray-600">
          Añade las variables de entorno <code className="bg-gray-100 px-2 py-1 rounded">VITE_SUPABASE_URL</code> y{' '}
          <code className="bg-gray-100 px-2 py-1 rounded">VITE_SUPABASE_ANON_KEY</code> en tu entorno de despliegue.
          Puedes usar el archivo <code className="bg-gray-100 px-2 py-1 rounded">.env.example</code> como referencia y copiarlo
          a <code className="bg-gray-100 px-2 py-1 rounded">.env</code> con tus credenciales.
        </p>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Conexiones</h1>
          <p className="text-lg text-gray-600 mb-6">
            Una historia colectiva creada automáticamente con palabras de muchas personas
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
              fragmentCount={storyFragments.length}
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
              {addingFragment ? 'Publicando...' : 'Publicar fragmento'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default App
