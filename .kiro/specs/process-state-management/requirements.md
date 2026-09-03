# Requirements Document

## Introduction

Ten dokument definiuje wymagania dla implementacji ADR 0003: Zarządzanie Stanem Procesu przez ReactiveController i @lit/context. Cellem jest ujednolicenie tras procesu zdefiniowanych w ADR oraz dodanie mechanizmu strażników tras (route guards), które blokują dostęp do kroków, dla których nie spełniono warunków wstępnych.

## Glossary

- **Application Process**: Wieloetapowy przepływ biznesowy prowadzący klienta przez proces składania wniosku o produkt finansowy od rozpoczęcia do zakończenia.
- **Process Step**: Dyskretny, sekwencyjny etap w ramach Application Process (np. Calculation, Email Verification, Phone Verification, Dashboard).
- **ProcessController**: ReactiveController zarządzający stanem procesu, statusem postępu kroków oraz strażnikami nawigacji.
- **Route Guard**: Mechanizm walidacji dostępu do trasy przed jej renderowaniem; blokuje nawigację, gdy warunki wstępne nie są spełnione.
- **Process Shell**: Komponent powłoki dostarczający ProcessController przez kontekst Lit i obsługujący routing.
- **Calculation Data**: Parametry finansowe i obliczone terminy ustalone podczas kroku Calculation, wymagane przez kolejne kroki.
- **Step Status**: Stan ukończenia kroku: 'pending' lub 'completed'.

## Requirements

### Requirement 1: Ujednolicenie Tras Procesu

**User Story:** Jako deweloper, chcę mieć trasy zgodne z ADR 0003, aby architektura kodu odzwierciedlała decyzje projektowe.

#### Kryteria Akceptacji

1. THE Process Shell SHALL definiować trasy zgodne z krokami zdefiniowanymi w ProcessController: 'calculation', 'email-verification', 'phone-verification', 'dashboard'
2. THE Process Shell SHALL zachować trasę startową '' lub '/' jako punkt wejścia do procesu
3. WHEN użytkownik nawiguje do nieistniejącej trasy, THE Process Shell SHALL przekierować do strony startowej procesu

### Requirement 2: Mechanizm Strażników Tras

**User Story:** Jako produkt owner, chcę aby użytkownicy nie mogli przeskakiwać kroków procesu, aby zapewnić spójność danych i zgodność z przepisami.

#### Kryteria Akceptacji

1. WHEN użytkownik próbuje nawigować do kroku 'email-verification', THE Route Guard SHALL sprawdzić czy ProcessController.canAccess('email-verification') zwraca true
2. WHEN użytkownik próbuje nawigować do kroku 'phone-verification', THE Route Guard SHALL sprawdzić czy ProcessController.canAccess('phone-verification') zwraca true
3. WHEN użytkownik próbuje nawigować do kroku 'dashboard', THE Route Guard SHALL sprawdzić czy ProcessController.canAccess('dashboard') zwraca true
4. IF ProcessController.canAccess(step) zwraca false, THEN THE Route Guard SHALL przekierować użytkownika do najwcześniejszego niedokończonego kroku
5. THE Route Guard SHALL pozwalać na dostęp do kroku 'calculation' bez warunków wstępnych

### Requirement 3: Przekierowanie do Najwcześniejszego Niedokończonego Kroku

**User Story:** Jako użytkownik, chcę być przekierowany do odpowiedniego kroku gdy próbuję uzyskać dostęp do zablokowanego etapu, aby wiedzieć gdzie kontynuować proces.

#### Kryteria Akceptacji

1. WHEN ProcessController.canAccess(step) zwraca false, THE ProcessController SHALL zwrócić identyfikator najwcześniejszego niedokończonego kroku przez metodę getFirstUncompletedStep()
2. WHILE step status 'calculation' wynosi 'pending', THE Route Guard SHALL przekierować do trasy '/process/calculation'
3. WHILE step status 'calculation' wynosi 'completed' AND step status 'email-verification' wynosi 'pending', THE Route Guard SHALL przekierować do trasy '/process/email-verification'
4. WHILE step status 'email-verification' wynosi 'completed' AND step status 'phone-verification' wynosi 'pending', THE Route Guard SHALL przekierować do trasy '/process/phone-verification'

### Requirement 4: Integracja Strażników z Lit Router

**User Story:** Jako deweloper, chcę aby strażnicy tras były zintegrowane z @lit-labs/router, aby mechanizm był spójny z architekturą Lit.

#### Kryteria Akceptacji

1. THE Route Guard SHALL być zaimplementowany w callbacku 'enter' definicji trasy w Process Shell
2. WHEN callback 'enter' zwraca false lub wykonuje przekierowanie, THE Lit Router SHALL zablokować renderowanie docelowej trasy
3. THE Route Guard SHALL mieć dostęp do instancji ProcessController przez this wewnątrz callbacku 'enter'

### Requirement 5: Komunikat Użytkownika przy Przekierowaniu

**User Story:** Jako użytkownik, chcę widzieć komunikat gdy jestem przekierowany z powodu nieukończenia poprzednich kroków, aby zrozumieć dlaczego nie mogę przejść dalej.

#### Kryteria Akceptacji

1. WHEN Route Guard przekierowuje użytkownika, THE Process Shell SHALL wyświetlić komunikat informujący o konieczności ukończenia poprzednich kroków
2. THE komunikat SHALL być widoczny przez 3 sekundy lub do momentu jego odrzucenia przez użytkownika
3. THE komunikat SHALL mieć styl wizualny odróżniający się od treści strony (np. baner ostrzegawczy)

### Requirement 6: Wizualny Indukator Dostępności Kroków

**User Story:** Jako użytkownik, chcę widzieć które kroki są dostępne a które zablokowane, aby wiedzieć gdzie mogę nawigować.

#### Kryteria Akceptacji

1. THE Process Shell SHALL renderować stepper z wizualnym oznaczeniem dostępnych i zablokowanych kroków
2. WHEN krok jest niedostępny, THE stepper SHALL wyświetlić go jako zablokowany (np. szary kolor, brak linku)
3. WHEN krok jest dostępny, THE stepper SHALL wyświetlić go jako klikalny link
4. WHEN użytkownik klika na zablokowany krok, THE stepper SHALL wyświetlić tooltip z informacją o konieczności ukończenia poprzednich kroków

### Requirement 7: Spójność Stanu przy Odświeżeniu Strony

**User Story:** Jako użytkownik, po odświeżeniu strony chcę być przekierowany do odpowiedniego kroku, aby nie stracić postępu procesu.

#### Kryteria Akceptacji

1. WHEN użytkownik odświeża stronę będąc na zablokowanym kroku, THE Route Guard SHALL przekierować do najwcześniejszego niedokończonego kroku
2. WHILE wszystkie kroki są w statusie 'pending', THE Route Guard SHALL pozwolić na pozostanie na stronie startowej lub przekierować do 'calculation'

### Requirement 8: Wsteczna Kompatybilność z Istniejącymi Trasami

**User Story:** Jako deweloper, chcę zachować wsteczną kompatybilność z istniejącymi trasami 'income' i 'summary', aby nie zepsuć istniejących zakładek i linków.

#### Kryteria Akceptacji

1. WHEN użytkownik nawiguje do trasy '/process/income', THE Process Shell SHALL przekierować do odpowiedniego kroku według nowego schematu
2. WHEN użytkownik nawiguje do trasy '/process/summary', THE Process Shell SHALL przekierować do odpowiedniego kroku według nowego schematu
