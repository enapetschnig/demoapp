-- Fix: CASE liefert text, payment_status ist enum -> expliziter Cast nötig.
create or replace function public.recompute_document_payment(p_doc uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_paid numeric(14,2); v_gross numeric(14,2);
begin
  select coalesce(sum(amount),0) into v_paid from public.payments where document_id = p_doc;
  select gross_amount into v_gross from public.documents where id = p_doc;
  update public.documents set
    open_amount = round(coalesce(v_gross,0) - v_paid, 2),
    payment_status = (case
      when v_paid <= 0 then 'offen'
      when v_paid >= coalesce(v_gross,0) then 'bezahlt'
      else 'teilzahlung' end)::payment_status
  where id = p_doc;
end $$;
