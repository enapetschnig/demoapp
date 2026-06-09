-- ============================================================
-- 0004 STORAGE-BUCKETS
-- company-assets: Logos (öffentlich lesbar, für <img> & PDF)
-- documents: erzeugte PDFs
-- project-files: Projektfotos/-dateien
-- ============================================================

insert into storage.buckets (id, name, public)
values ('company-assets','company-assets', true),
       ('documents','documents', true),
       ('project-files','project-files', true)
on conflict (id) do nothing;

-- Öffentlich lesbar (Demo); Schreiben nur für angemeldete Nutzer
do $$
declare b text;
begin
  foreach b in array array['company-assets','documents','project-files'] loop
    execute format($p$drop policy if exists %I on storage.objects$p$, 'read_'||b);
    execute format($p$drop policy if exists %I on storage.objects$p$, 'write_'||b);
    execute format($p$drop policy if exists %I on storage.objects$p$, 'update_'||b);
    execute format($p$drop policy if exists %I on storage.objects$p$, 'delete_'||b);
    execute format($p$create policy %I on storage.objects for select using (bucket_id = %L)$p$, 'read_'||b, b);
    execute format($p$create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L)$p$, 'write_'||b, b);
    execute format($p$create policy %I on storage.objects for update to authenticated using (bucket_id = %L)$p$, 'update_'||b, b);
    execute format($p$create policy %I on storage.objects for delete to authenticated using (bucket_id = %L)$p$, 'delete_'||b, b);
  end loop;
end $$;
