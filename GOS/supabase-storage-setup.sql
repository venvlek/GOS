-- Run this once in Supabase's SQL Editor, same as supabase-setup.sql earlier.
-- Creates a storage bucket for uploaded Word documents (lesson notes / diary
-- uploads) so they can be viewed exactly as Word renders them, or downloaded.

insert into storage.buckets (id, name, public)
values ('lesson-docs', 'lesson-docs', true)
on conflict (id) do nothing;

-- Same trade-off as the main table's policies (see README "Security note"):
-- the anon key can read and write this bucket directly. Fine for a small
-- internal tool, not real per-user security.
create policy "anon can upload lesson docs"
on storage.objects for insert
with check (bucket_id = 'lesson-docs');

create policy "anon can read lesson docs"
on storage.objects for select
using (bucket_id = 'lesson-docs');

create policy "anon can update lesson docs"
on storage.objects for update
using (bucket_id = 'lesson-docs');
