import { test, expect, type Page } from "@playwright/test";

async function signup(page: Page) {
  await page.goto("/auth");
  await page.getByRole("tab", { name: "Registrieren" }).click();
  const email = `crit${Date.now()}@example.at`;
  await page.locator("#fn").fill("Krit");
  await page.locator("#ln").fill("Test");
  await page.locator("#cn").fill("Krit GmbH");
  await page.locator("#email2").fill(email);
  await page.locator("#password2").fill("demo123456");
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await expect(page.getByText("Übersicht").first()).toBeVisible({ timeout: 20_000 });
}

test("Kritischer Pfad: Angebot über Dialog → Position → abschließen → PDF-Vorschau", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await signup(page);

  // Seed-Kunde vorhanden?
  await page.goto("/kontakte");
  await expect(page.getByText("Mustermann").first()).toBeVisible({ timeout: 15_000 });

  // Dokument (Angebot) über den Dialog erstellen
  await page.goto("/dokumente");
  await page.getByRole("button", { name: "Dokument", exact: true }).click();
  await expect(page.getByText("Dokument erstellen")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Bitte auswählen" }).click();
  await page.getByPlaceholder("Kontakt oder Projekt suchen…").fill("Mustermann");
  await page.getByRole("option").first().click();

  await page.getByText("Bitte auswählen").click(); // Typ-Select
  await page.getByRole("option", { name: "Angebot", exact: true }).click();
  await page.getByRole("button", { name: "Weiter" }).click();

  // Editor offen → Position aus Katalog hinzufügen
  await expect(page.getByText("Dokumenttyp")).toBeVisible({ timeout: 15_000 });
  await page.getByPlaceholder("Artikel oder Leistung").fill("PV");
  await page.locator("button", { hasText: "PV Modul" }).first().click();
  await expect(page.getByText("Gesamtsumme")).toBeVisible();

  // Abschließen → Nummer vergeben
  await page.getByRole("button", { name: "Dokument abschließen" }).click();
  await expect(page.getByText(/ANG-\d{4}/).first()).toBeVisible({ timeout: 15_000 });

  // PDF-Vorschau → typ-spezifische Überschrift
  await page.getByRole("button", { name: "PDF-Vorschau" }).click();
  await expect(page.getByText(/Angebot-Nr\./).first()).toBeVisible({ timeout: 10_000 });

  expect(errors, errors.join("\n")).toEqual([]);
});
