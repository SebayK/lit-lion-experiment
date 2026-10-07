# Lit Lion Experiment

Projekt zarządzania procesami wnioskowymi produktów finansowych, wykorzystujący architekturę Lit, komponenty Lion.js oraz Redux Toolkit.

---

## Agent Skills & Repomix Context

Repozytorium wykorzystuje otwarty standard **[Agent Skills](https://github.com/agentskills/agentskills)** (`.agents/skills/`) do standaryzacji pracy asystentów AI (Antigravity, Claude Code, GitHub Copilot Agent Mode).

Kluczowym elementem architektury kontekstu jest **Repomix** — narzędzie pakujące strukturę i zawartość repozytorium do pliku `repomix-output.xml`, co pozwala agentom operować na precyzyjnym snapshotcie kodu bez zaśmiecania okna kontekstowego modelu.

---

### Dlaczego Repomix jako lokalny snapshot?

1. **Zamiast wklejać setki plików do czatu:** Duże pliki wstrzykiwane bezpośrednio do promptu powodują obcinanie tokenów (truncation) lub spadek precyzji odpowiedzi (efekt *lost-in-the-middle*).
2. **Przeszukiwanie na żądanie:** Agent przeszukuje `repomix-output.xml` przez polecenia terminala (`rg`, `grep`, `Select-String`, `findstr`), pobierając wyłącznie interesujące go symbole, interfejsy i pliki.
3. **Reprodukowalny kontekst:** Cały zespół i agenci AI pracują na tym samym, zweryfikowanym obrazie bazy kodu.

---

### Jak wygenerować snapshot Repomixa ręcznie

Repomix jest zainstalowany lokalnie w projekcie (`devDependencies`).

```bash
# Wygenerowanie pełnego snapshotu (domyślnie tworzy repomix-output.xml)
npx repomix

# Wygenerowanie snapshotu dla wybranego zakresu modułów
npx repomix . --include "src/features/income/**,CONTEXT.md,package.json" --style xml --output repomix-output.xml
```

#### Weryfikacja istnienia snapshotu (wieloplatformowo):
* **Linux / macOS (Bash/Zsh):**
  ```bash
  test -s repomix-output.xml && echo "Snapshot istnieje"
  ```
* **Windows (PowerShell):**
  ```powershell
  if ((Test-Path repomix-output.xml) -and (Get-Item repomix-output.xml).Length -gt 0) { Write-Host "Snapshot istnieje" }
  ```
* **Windows (CMD):**
  ```cmd
  if exist repomix-output.xml (for %I in (repomix-output.xml) do @if %~zI gtr 0 echo Snapshot istnieje)
  ```
* **Node.js (dowolny system):**
  ```bash
  node -e "const fs = require('fs'); console.log(fs.existsSync('repomix-output.xml') && fs.statSync('repomix-output.xml').size > 0 ? 'Snapshot istnieje' : 'Brak snapshotu');"
  ```

---

### Dostępne skille w `.agents/skills/`

Wszystkie skille znajdują się w katalogu `.agents/skills/` i zawierają pliki instrukcji `SKILL.md`:

| Skill | Opis |
|---|---|
| **`repomix-context`** | Sprawdza obecność `repomix-output.xml`, generuje go w razie potrzeby i wyszukuje niezbędne symbole przed przystąpieniem do zadania. |
| **`implement`** | Przeprowadza pełną implementację zadania: od załadowania kontekstu przez pętlę TDD (Red-Green-Refactor) po weryfikację i commit. |
| **`tdd`** | Prowadzi proces implementacji test-first (pisanie testu, weryfikacja błędu, kod produkcyjny, refactor). |
| **`code-review`** | Dwuosiowy przegląd kodu (zgodność ze standardami + zgodność ze specyfikacją). |
| **`diagnosing-bugs`** | Pętla diagnostyczna trudnych błędów z minimalnym scenariuszem odtworzenia. |
| **`ask-matt`** | Router po skilach i przepływach pracy w repozytorium. |

---

### Jak używać skilli z asystentami AI

#### 1. W Antigravity / Claude Code
Agent automatycznie wykrywa skille i reguły z `AGENTS.md`. Wystarczy wywołać skill z poziomu czatu:
```text
/implement Zaimplementuj nowy krok dochodowy dla umowy zlecenie
```
lub zapytać o kontekst:
```text
/repomix-context
```

#### 2. W GitHub Copilot (VS Code)
Upewnij się, że pracujesz w **Agent Mode**:
1. Copilot automatycznie odczytuje instrukcje z pliku `.github/copilot-instructions.md`.
2. W oknie czatu wpisz zadanie, odwołując się do skilla:
   ```text
   /implement Dodaj walidację kwoty dochodu
   ```
   lub:
   ```text
   Uruchom skill repomix-context, aby sprawdzić strukturę komponentu income-dialog.ts
   ```
3. **Ważne:** Nie wklejaj całego pliku `repomix-output.xml` do czatu. Copilot przeszuka go w terminalu za pomocą `rg` / `Select-String` / `findstr`.

---

### GitHub Copilot Memory a Repomix

GitHub Copilot posiada wbudowaną usługę w chmurze **[Copilot Memory](https://docs.github.com/en/copilot/concepts/agents/copilot-memory)** (w fazie Public Preview):
* Zapisuje ona fakty o repozytorium (`Repository-level facts`) oraz preferencje użytkownika (`User-level preferences`) w profilu GitHub.
* Jeśli Copilot korzysta z nieaktualnych faktów zamiast sprawdzać aktualny stan bazy kodu, możesz zweryfikować lub usunąć zapamiętane dane:
  * **Fakty repozytorium:** `GitHub.com -> Repozytorium -> Settings -> Copilot -> Memory`
  * **Preferencje osobiste:** `GitHub.com -> Profil (ikona w prawym górnym rogu) -> Settings -> Copilot -> Memory` (lub bezpośrednio: [https://github.com/settings/copilot/memory](https://github.com/settings/copilot/memory)).

Zalecaną praktyką jest wymuszenie w `.github/copilot-instructions.md`, aby agent zawsze weryfikował bieżący snapshot z Repomixa przed podjęciem decyzji projektowych.
