# 02 — Przebudowa `income-dialog` na Formularz Sterowany Konfiguracją

**What to build:** Zmiana komponentu `<income-dialog>`, aby był w 100% sterowany przez propercję `config`. Pola formularza muszą pojawiać się i znikać w zależności od wybranego Źródła Dochodu. Walidatory dla pól (np. minimalna kwota) są wstrzykiwane z przekazanej konfiguracji, a nie zapisane na sztywno. Zachowujemy standardy `Lit` (reaktywność) oraz mechanizmy `lion-form` (poprawne wiązanie modelValue).

**Blocked by:** 01 — Zdefiniowanie Typów Konfiguracji i Rozszerzenie Modelu (Redux)

**Status:** ready-for-agent

- [ ] `<income-dialog>` przyjmuje prop `config` reprezentujący ustawienia produktu.
- [ ] Wybór konkretnego źródła dochodu renderuje tylko powiązane z nim pola.
- [ ] Instancje walidatorów `Lion` (np. `Required`, `MinNumber`) są podpinane na bazie obiektu konfiguracyjnego.
- [ ] Komponent poprawnie obsługuje cykl życia Lita (updateComplete) dla warunkowo pojawiających się pól z formularza Lion.
