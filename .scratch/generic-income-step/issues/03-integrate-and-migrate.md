# 03 — Wpięcie Formularza w `income-app` i Migracja Produktów

**What to build:** Zastąpienie starych, zduplikowanych implementacji nowym, spójnym flow, gdzie nadrzędny komponent podaje konfigurację w dół do `<income-app>`. Komponenty `income-app` i `income-dialog` stają się Dumb Components (prezentacyjne). Utrzymujemy separację warstwy widoku od logiki domenowej Reduxa.

**Blocked by:** 02 — Przebudowa `income-dialog` na Formularz Sterowany Konfiguracją

**Status:** ready-for-agent

- [ ] `<income-app>` odbiera prop `config` i dystrybuuje go w dół drzewa komponentów.
- [ ] Konfiguracje dla różnych produktów biznesowych są przetestowane na żywym komponencie (np. w index.html / głównym komponencie renderującym).
- [ ] Ewentualne przestarzałe komponenty kroku dochodowego (jeśli są w projekcie pod innymi nazwami) mogą zostać usunięte.
- [ ] Cały formularz (UI <-> LionForm <-> Redux) zapisuje kompletny, poprawny model `Income` do store'a.
