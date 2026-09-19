-- Meridian media library extension.
-- Run this only once in the existing Supabase project. It does not alter or recreate existing tables.
create table if not exists media_assets (
  id bigserial primary key,
  storage_path text not null unique,
  public_url text not null,
  file_name text not null,
  media_type text not null check (media_type in ('image', 'video')),
  purpose text not null check (purpose in ('product', 'brand', 'mosaic', 'video', 'poster', 'general')),
  mime_type text not null,
  file_size integer not null check (file_size > 0),
  width integer,
  height integer,
  aspect_ratio numeric(10,5),
  created_at timestamptz not null default now()
);
create index if not exists media_assets_type_idx on media_assets (media_type);
create index if not exists media_assets_purpose_idx on media_assets (purpose);
create index if not exists media_assets_created_at_idx on media_assets (created_at desc);

-- The storefront needs to read media metadata without a customer session.
-- Upload, update, and delete operations are performed only by the server using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. No browser client receives that key.
alter table media_assets enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'media_assets' and policyname = 'media_assets_public_read'
  ) then
    create policy media_assets_public_read on public.media_assets
      for select to anon, authenticated using (true);
  end if;
end
$$;

-- Create the public bucket safely if it does not already exist. Existing bucket
-- settings are preserved except that this ensures it is publicly readable.
insert into storage.buckets (id, name, public)
values ('meridian-media', 'meridian-media', true)
on conflict (id) do update set public = true;

-- Create a public Supabase Storage bucket named `meridian-media` from the Supabase
-- Dashboard Storage page, or let the server create it on the first authenticated upload.
-- Files are public because the storefront renders product/brand media without a user session.
