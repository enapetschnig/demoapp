-- ============================================================
-- 0002 BOOTSTRAP: legt für den aktuellen Nutzer einen Mandanten
-- mit vollständigen Standarddaten an (einmalig bei Registrierung).
-- ============================================================

create or replace function public.bootstrap_company(p_name text default 'Mein Betrieb')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company uuid;
  v_branch uuid;
  v_pt_projekte uuid;
  v_pt_pv uuid;
  v_pt_dach uuid;
  v_pt_montage uuid;
  v_f_angebote uuid; v_f_rechnungen uuid; v_f_ab uuid; v_f_mahnung uuid;
  v_f_allgemein uuid; v_f_storno uuid; v_f_gutschrift uuid; v_f_ls uuid;
  v_cust uuid;
  rec record;
begin
  -- nur wenn der Nutzer noch keinem Mandanten zugeordnet ist
  if (select company_id from public.profiles where id = auth.uid()) is not null then
    return (select company_id from public.profiles where id = auth.uid());
  end if;

  insert into public.companies (name) values (coalesce(nullif(p_name,''),'Mein Betrieb'))
  returning id into v_company;

  -- Profil zuordnen, Inhaber = Geschäftsführer
  update public.profiles
     set company_id = v_company, role = 'geschaeftsfuehrer', user_kind = 'standard'
   where id = auth.uid();

  -- Niederlassung
  insert into public.branches (company_id, name) values (v_company, 'Hauptsitz') returning id into v_branch;
  update public.profiles set branch_id = v_branch where id = auth.uid();

  -- Nummernkreise
  insert into public.number_ranges (company_id, key, name, prefix, start_number, next_number) values
    (v_company,'angebot','Angebot','ANG-',1,1),
    (v_company,'rechnung','Rechnung','RE-',1,1),
    (v_company,'auftragsbestaetigung','Auftragsbestätigung','AB-',1,1),
    (v_company,'lieferschein','Lieferschein','LS-',1,1),
    (v_company,'gutschrift','Gutschrift','GS-',1,1),
    (v_company,'stornorechnung','Stornorechnung','ST-',1,1),
    (v_company,'mahnung','Mahnung','MA-',1,1),
    (v_company,'aufmassdokument','Aufmaßdokument','AFM-',1,1),
    (v_company,'arbeitsbericht','Arbeitsbericht','ARB-',1,1),
    (v_company,'baustellenbericht','Baustellenbericht','BER-',1,1),
    (v_company,'bestellschein','Bestellschein','BS-',1,1),
    (v_company,'brief','Brief','B-',1,1),
    (v_company,'wartungsauftrag','Wartungsauftrag','WA-',1,1),
    (v_company,'reparaturauftrag','Reparaturauftrag','RA-',1,1),
    (v_company,'kalkulation','Kalkulation','KALK-',1,1),
    (v_company,'allgemein','Allgemein','ALL-',1,1);

  -- Ordner
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Angebote',true) returning id into v_f_angebote;
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Auftragsbestätigungen',true) returning id into v_f_ab;
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Rechnungen',true) returning id into v_f_rechnungen;
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Mahnung',true) returning id into v_f_mahnung;
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Gutschriften',true) returning id into v_f_gutschrift;
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Stornorechnungen',true) returning id into v_f_storno;
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Lieferscheine',true) returning id into v_f_ls;
  insert into public.document_folders (company_id, name, is_system) values
    (v_company,'Allgemein',true) returning id into v_f_allgemein;
  insert into public.document_folders (company_id, name) values
    (v_company,'Reparaturaufträge'),(v_company,'Baustellenberichte'),(v_company,'Bestellscheine'),
    (v_company,'Briefe'),(v_company,'Lieferant'),(v_company,'Wartungsauftrag'),
    (v_company,'Aufmaße'),(v_company,'Arbeitsbericht'),(v_company,'Kalkulation');

  -- Dokumenttypen (Konfigurator)
  insert into public.document_types (company_id, base_type, name, default_folder_id, number_range_key, booking_relevant, subject_prefix, sort_order) values
    (v_company,'allgemein','Allgemein',v_f_allgemein,'allgemein',false,'',1),
    (v_company,'angebot','Angebot',v_f_angebote,'angebot',false,'Angebot-Nr.',2),
    (v_company,'arbeitsbericht','Arbeitsbericht',null,'arbeitsbericht',false,'',3),
    (v_company,'aufmassdokument','Aufmaßdokument',null,'aufmassdokument',false,'',4),
    (v_company,'auftragsbestaetigung','Auftragsbestätigung',v_f_ab,'auftragsbestaetigung',false,'Auftragsbestätigung-Nr.',5),
    (v_company,'baustellenbericht','Baustellenbericht',null,'baustellenbericht',false,'',6),
    (v_company,'bestellschein','Bestellschein',null,'bestellschein',false,'',7),
    (v_company,'brief','Brief',null,'brief',false,'',8),
    (v_company,'gutschrift','Gutschrift',v_f_gutschrift,'gutschrift',true,'Gutschrift-Nr.',9),
    (v_company,'kalkulation','Kalkulation',null,'kalkulation',false,'',10),
    (v_company,'lieferschein','Lieferschein',v_f_ls,'lieferschein',false,'Lieferschein-Nr.',11),
    (v_company,'mahnung','Mahnung',v_f_mahnung,'mahnung',false,'',12),
    (v_company,'rechnung','Rechnung',v_f_rechnungen,'rechnung',true,'Rechnung-Nr.',13),
    (v_company,'rechnung_13b','Rechnung §13b',v_f_rechnungen,'rechnung',true,'Rechnung-Nr.',14),
    (v_company,'reparaturauftrag','Reparaturauftrag',null,'reparaturauftrag',false,'',15),
    (v_company,'stornorechnung','Stornorechnung',v_f_storno,'stornorechnung',true,'Stornorechnung-Nr.',16),
    (v_company,'wartungsauftrag','Wartungsauftrag',null,'wartungsauftrag',false,'',17);

  -- Quellen
  insert into public.project_sources (company_id, name)
  select v_company, x from unnest(array[
    'Außenwerbung','Bestandskunde','E-Mail','Eigene Webseite','Empfehlung','Fahrzeugwerbung',
    'Flyer / Prospekt','Interessent','Messe','Netzwerk','Online-Portal','Persönlicher Kontakt',
    'Social Media','Sonstige','Telefon']) as x;

  -- Verkaufspreis-Stufe
  insert into public.sales_prices (company_id, name, is_standard, markup_percent)
  values (v_company,'VK1',true,0);

  -- Standard-Leistung
  insert into public.services (company_id, service_number, name, time_minutes, unit, price, vat_rate)
  values (v_company,'1000','Monteurstunde',60,'Std',35.00,20.00);

  -- Demo-Artikel (sofort einsetzbar)
  insert into public.articles (company_id, article_number, name, category, unit, purchase_price, sale_price, vat_rate) values
    (v_company,'1002','Verteiler Umbau','Elektro','Stk',650.00,890.00,20),
    (v_company,'1003','Sicherungsautomat','Elektro','Stk',28.00,45.00,20),
    (v_company,'1004','PV Modul 400 W','Photovoltaik','Stk',95.00,147.00,20),
    (v_company,'1005','Wechselrichter 10 kW','Photovoltaik','Stk',1200.00,1899.00,20),
    (v_company,'1006','Wallbox 11 kW','Photovoltaik','Stk',780.00,1149.00,20);

  -- Textbausteine
  insert into public.document_texts (company_id, kind, source, title, content, base_type, placement) values
    (v_company,'text','system','Angebot - Einleitung','<p>Sehr geehrte Damen und Herren,</p><p>vielen Dank für Ihre Anfrage. Gerne unterbreiten wir Ihnen folgendes Angebot:</p>','angebot','einleitung'),
    (v_company,'text','system','Angebot - Abschluss','<p>Wir freuen uns auf Ihren Auftrag. Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p><p>Mit freundlichen Grüßen</p>','angebot','abschluss'),
    (v_company,'text','system','Rechnung - Einleitung','<p>Sehr geehrte Damen und Herren,</p><p>wir erlauben uns, für die erbrachten Leistungen wie folgt Rechnung zu legen:</p>','rechnung','einleitung'),
    (v_company,'text','system','Rechnung - Abschluss','<p>Bitte überweisen Sie den Rechnungsbetrag innerhalb von 14 Tagen auf das unten angegebene Konto.</p><p>Mit freundlichen Grüßen</p>','rechnung','abschluss'),
    (v_company,'text','system','Mahnung - Einleitung','<p>Sehr geehrte Damen und Herren,</p><p>unsere Rechnung {{ReferenceDocument.nr}} vom {{ReferenceDocument.date}} über {{ReferenceDocument.brutto}} ist noch offen.</p>','mahnung','einleitung'),
    (v_company,'text','system','Auftragsbestätigung - Einleitung','<p>Sehr geehrte Damen und Herren,</p><p>vielen Dank für Ihren Auftrag, den wir hiermit gerne bestätigen:</p>','auftragsbestaetigung','einleitung');

  -- E-Mail-Templates
  insert into public.email_templates (company_id, name, context, subject, body, is_system) values
    (v_company,'Angebot verschicken','dokument-angebot','Ihr Angebot {{Document.nr}} | {{Company.name}}','<p>Sehr geehrte Damen und Herren,</p><p>anbei erhalten Sie Ihr Angebot.</p>',true),
    (v_company,'Rechnung verschicken','dokument-rechnung','Ihre Rechnung {{Document.nr}} | {{Company.name}}','<p>Sehr geehrte Damen und Herren,</p><p>anbei erhalten Sie Ihre Rechnung.</p>',true),
    (v_company,'Auftragsbestätigung verschicken','dokument-auftragsbestaetigung','Ihre Auftragsbestätigung {{Document.nr}}','<p>Sehr geehrte Damen und Herren,</p><p>anbei Ihre Auftragsbestätigung.</p>',true);

  -- Projekttypen / Pipelines
  insert into public.project_types (company_id, name, code, is_default, is_standard, sort_order, color)
    values (v_company,'Projekte','PRJ',true,true,1,'#3b82f6') returning id into v_pt_projekte;
  insert into public.project_types (company_id, name, code, sort_order, color)
    values (v_company,'PV-Installationen','PV',2,'#f59e0b') returning id into v_pt_pv;
  insert into public.project_types (company_id, name, code, sort_order, color)
    values (v_company,'Dachdecken','DAC',3,'#ef4444') returning id into v_pt_dach;
  insert into public.project_types (company_id, name, code, sort_order, color)
    values (v_company,'Montagearbeiten','MON',4,'#8b5cf6') returning id into v_pt_montage;

  -- allgemeine Pipeline (12 Phasen) für Projekte, Dachdecken, Montagearbeiten
  for rec in select * from (values
      ('Neu - Erstkontakt','Neu - Erstkontakt',201,1),
      ('Vor-Ort-Termin','Vor-Ort Termin',400,2),
      ('Angebotserstellung','Angebotserstellung',700,3),
      ('Detailgespräch','Detailgespräch',701,4),
      ('Auftragsvergabe','Auftragsvergabe',801,5),
      ('Auftragsbestätigung','Auftragsbestätigung',1001,6),
      ('Umsetzungsbeginn','Umsetzungsbeginn',1101,7),
      ('In Umsetzung','In Umsetzung',1111,8),
      ('Kundenrechnung','Kundenrechnung',1150,9),
      ('Reklamation','Reklamation',1500,10),
      ('Abgeschlossen','Abgeschlossen',2000,11),
      ('Archiviert','Archiviert',2100,12)
    ) as s(name,base,code,ord)
  loop
    insert into public.project_steps (company_id, project_type_id, name, base_status, status_code, sort_order)
    values (v_company, v_pt_projekte, rec.name, rec.base, rec.code, rec.ord),
           (v_company, v_pt_dach, rec.name, rec.base, rec.code, rec.ord),
           (v_company, v_pt_montage, rec.name, rec.base, rec.code, rec.ord);
  end loop;

  -- PV-Pipeline (11 Phasen, branchenspezifisch)
  for rec in select * from (values
      ('Neu - Erstkontakt','Neu - Erstkontakt',201,1),
      ('Besichtigung PV-Anlage','Vor-Ort Termin',400,2),
      ('Verkaufsgespräch','Detailgespräch',701,3),
      ('Auftragsvergabe','Auftragsvergabe',801,4),
      ('Auftragsbestätigung','Auftragsbestätigung',1001,5),
      ('Umsetzungsbeginn','Umsetzungsbeginn',1101,6),
      ('In Umsetzung','In Umsetzung',1111,7),
      ('Kundenrechnung','Kundenrechnung',1150,8),
      ('Reklamation','Reklamation',1500,9),
      ('Abgeschlossen','Abgeschlossen',2000,10),
      ('Archiviert','Archiviert',2100,11)
    ) as s(name,base,code,ord)
  loop
    insert into public.project_steps (company_id, project_type_id, name, base_status, status_code, sort_order)
    values (v_company, v_pt_pv, rec.name, rec.base, rec.code, rec.ord);
  end loop;

  -- Demo-Kunde
  insert into public.contacts (company_id, type, category, customer_number, first_name, last_name, salutation, email, address_street, address_zip, address_city)
  values (v_company,'person','kunde','1001','Max','Mustermann','Herr','max.mustermann@example.at','Musterstraße 1','9500','Villach')
  returning id into v_cust;

  return v_company;
end $$;

grant execute on function public.bootstrap_company(text) to authenticated;
grant execute on function public.next_document_number(uuid, text) to authenticated;
grant execute on function public.next_project_number(uuid) to authenticated;
grant execute on function public.current_company_id() to authenticated;
grant execute on function public.current_role() to authenticated;
