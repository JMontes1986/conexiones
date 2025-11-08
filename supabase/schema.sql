-- Crear tabla de fragmentos
create table if not exists public.fragments (
  id uuid primary key default gen_random_uuid(),
  keyword text not null check (char_length(keyword) between 1 and 48),
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamp with time zone default now()
);

-- Habilitar Row Level Security
alter table public.fragments enable row level security;

-- Políticas abiertas para demo (ajustar en producción con auth)
create policy "Permitir lectura a todos" on public.fragments 
  for select using (true);

create policy "Permitir inserción a todos" on public.fragments 
  for insert with check (true);

-- Índices para optimizar búsquedas
create index if not exists idx_fragments_keyword 
  on public.fragments (keyword);

create index if not exists idx_fragments_content 
  on public.fragments using gin (to_tsvector('spanish', content));

-- Índice para ordenar por fecha
create index if not exists idx_fragments_created_at 
  on public.fragments (created_at desc);
