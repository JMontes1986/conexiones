# Conexiones

Una historia colectiva con palabras de muchas personas. Aplicación web minimalista para buscar y compartir fragmentos de texto asociados a palabras clave.

## 🚀 Stack Tecnológico

- **React 18** + **Vite** - Framework y build tool
- **Tailwind CSS** - Estilos
- **Supabase** - Base de datos PostgreSQL y backend

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta en [Supabase](https://supabase.com) (gratis)

## 🛠️ Instalación

### 1. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. En el SQL Editor de tu proyecto, ejecuta el contenido de `supabase/schema.sql`
3. Copia tu **Project URL** y **anon/public key** desde Project Settings → API

### 2. Configurar Variables de Entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env con tus credenciales de Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-aqui
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📦 Producción

### Build

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`

### Deploy

Puedes desplegar en cualquier plataforma:

**Netlify:**
```bash
# Conecta tu repositorio y configura:
# Build command: npm run build
# Publish directory: dist
```

> ℹ️ Si al abrir tu deploy ves el mensaje "Password protected site", desactiva la contraseña desde **Site settings → General → Site protection** en Netlify o limpia cualquier contraseña configurada en **Access control**. Esto asegura que la app quede disponible públicamente.
> 
**Vercel:**
```bash
# Instala Vercel CLI
npm i -g vercel

# Deploy
vercel
```

No olvides configurar las variables de entorno en tu plataforma de hosting.

## 🔒 Seguridad en Producción

⚠️ **IMPORTANTE**: Este proyecto usa políticas de Supabase abiertas para facilitar la demo. Para producción:

1. **Habilita Autenticación**: Implementa Supabase Auth
2. **Actualiza las políticas RLS**: Restringe inserciones solo a usuarios autenticados
3. **Valida en el backend**: Agrega validaciones adicionales

Ejemplo de política segura:
```sql
-- Reemplaza la política "Permitir inserción a todos"
drop policy "Permitir inserción a todos" on public.fragments;

create policy "Usuarios autenticados pueden insertar" on public.fragments
  for insert with check (auth.role() = 'authenticated');
```

## 🎯 Características

- ✅ Búsqueda por palabra clave
- ✅ Búsqueda fallback por contenido
- ✅ Agregar fragmentos (keyword + contenido max 500 chars)
- ✅ Vista de resultados en grid responsivo
- ✅ Diseño minimalista y limpio
- ✅ Timestamps relativos
- ✅ Sin dependencias innecesarias

## 📁 Estructura del Proyecto

```
conexiones/
├── src/
│   ├── components/
│   │   ├── KeywordForm.jsx      # Formulario de búsqueda
│   │   └── FragmentList.jsx     # Lista de fragmentos
│   ├── lib/
│   │   └── supabaseClient.js    # Cliente de Supabase
│   ├── styles/
│   │   └── index.css            # Estilos Tailwind
│   ├── App.jsx                  # Componente principal
│   └── main.jsx                 # Entry point
├── supabase/
│   └── schema.sql               # Esquema de base de datos
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── README.md
```

## 🐛 Troubleshooting

**Error: "Failed to fetch"**
- Verifica que las credenciales de Supabase en `.env` sean correctas
- Asegúrate de haber ejecutado `schema.sql` en Supabase

**Estilos no se aplican**
- Verifica que `postcss.config.js` y `tailwind.config.js` estén configurados
- Reinicia el servidor de desarrollo

## 📄 Licencia

MIT

## 🤝 Contribuir

Pull requests son bienvenidos. Para cambios mayores, abre un issue primero.
---

Hecho con ❤️ usando React, Vite, Tailwind y Supabase
