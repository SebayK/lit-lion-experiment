# 01 — Zdefiniowanie Typów Konfiguracji i Rozszerzenie Modelu (Redux)

**What to build:** Przygotowanie infrastruktury typowania oraz modelu stanu. Krok ten pozwala na przechowywanie w globalnym stanie pełnego zakresu danych dochodowych (jak NIP, nazwa firmy, liczba dzieci) oraz wprowadza typy używane później do wstrzykiwania konfiguracji (np. `IncomeStepConfig`). Brak zmian wizualnych.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Plik `src/types/income-config.ts` (lub podobny) posiada eksportowane typy dla konfiguracji formularza i walidatorów.
- [ ] Typ `Income` w `src/store/index.ts` został rozszerzony o wszystkie potencjalne pola domenowe (NIP, firma, dzieci itp.).
- [ ] Typy są zgodne ze specyfikacją TypeScript (ścisłe typowanie).
