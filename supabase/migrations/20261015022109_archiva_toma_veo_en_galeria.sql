alter table public.publicidad_items
add column if not exists source_video_path text;

create unique index if not exists publicidad_items_source_video_path_key
on public.publicidad_items (source_video_path)
where source_video_path is not null;
