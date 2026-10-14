create table if not exists public.publicidad_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null check (source in ('camara', 'archivo')),
  status text not null default 'subiendo' check (status in ('subiendo', 'capturada', 'generando', 'completada', 'error')),
  image_path text not null unique,
  video_path text unique,
  prompt text not null default '',
  tone text not null default 'inspirador' check (tone in ('inspirador', 'tecnologico', 'energetico', 'institucional')),
  duration smallint not null default 10 check (duration in (10, 15, 20, 30)),
  format text not null default 'portrait' check (format in ('portrait', 'landscape')),
  error_message text not null default ''
);

alter table public.publicidad_items enable row level security;
revoke all on table public.publicidad_items from anon, authenticated;

create or replace function public.set_publicidad_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists publicidad_items_updated_at on public.publicidad_items;
create trigger publicidad_items_updated_at
before update on public.publicidad_items
for each row execute function public.set_publicidad_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'publicidad-utp',
  'publicidad-utp',
  false,
  209715200,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No se crean políticas para anon ni authenticated. La aplicación accede
-- exclusivamente desde el servidor con SUPABASE_SECRET_KEY y entrega enlaces
-- firmados de corta duración a sesiones autorizadas de Publicidad.
