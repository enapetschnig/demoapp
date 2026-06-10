-- ============================================================
-- 0008 Aufschlag (markup_percent) in der Positions-Kalkulation
-- + Mahngebühr-Spalte auf dunnings.
-- line_net = round(menge * EP * (1 + Aufschlag%/100) * (1 - Rabatt%/100), 2)
-- ============================================================

create or replace function public.set_item_line_net()
returns trigger language plpgsql as $$
begin
  if new.kind in ('artikel','leistung') then
    new.line_net := round(
      coalesce(new.quantity,0) * coalesce(new.unit_price,0)
      * (1 + coalesce(new.markup_percent,0)/100.0)
      * (1 - coalesce(new.discount_percent,0)/100.0), 2);
  else
    new.line_net := 0;
  end if;
  return new;
end $$;

-- bestehende Positionen neu berechnen (Trigger feuert bei Update)
update public.document_items set markup_percent = markup_percent where true;

alter table public.dunnings add column if not exists fee numeric(14,2) not null default 0;
