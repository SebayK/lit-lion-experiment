# 03: Obsłuż ponowienie, wygaśnięcie i blokadę

**What to build:** Użytkownik widzi pozostały czas i komunikaty dotyczące wyzwania, może ponowić wysyłkę zgodnie z cooldownem oraz rozpocząć nowe wyzwanie po wygaśnięciu lub blokadzie. Wspólny moduł obsługuje błędy i zmianę kontaktu, a mock backendu egzekwuje reguły kodu dla obu kanałów.

**Blocked by:** 02 — Potwierdź kod e-mail i ukończ krok.

**Status:** completed

**Implementation status:** completed.

Specyfikacja: [Uwierzytelnianie kodem e-mail i telefonu](../spec.md).

- [x] Mock backendu jest źródłem prawdy dla ważności kodu, liczby prób i dostępności ponownego wysłania. Reguły obowiązują dla obu kanałów i wyzwania przypisanego do `applicationId`.
- [x] Kod wygasa po pięciu minutach od udanej wysyłki. Wygasłego wyzwania nie można potwierdzić; moduł i UI pokazują stan `expired`.
- [x] Jedno wyzwanie pozwala na maksymalnie pięć prób. Piąta błędna próba blokuje dalsze potwierdzenia i powoduje stan `locked`; poprawny kod na piątej dopuszczonej próbie może zakończyć wyzwanie sukcesem.
- [x] UI wyświetla czas do ponownego wysłania, a żądanie nowego kodu jest niedostępne przed upływem 60 sekund od udanej wysyłki. Aktualny kod można w tym czasie wpisywać i potwierdzać.
- [x] Ponowne wysłanie korzysta z operacji żądania kodu i po sukcesie tworzy nowe wyzwanie z nowym limitem prób oraz czasami. Poprzednie wyzwanie nie może już zostać potwierdzone.
- [x] Po wygaśnięciu lub zablokowaniu użytkownik może rozpocząć nowe wyzwanie w widoku kodu, z zachowaniem reguły cooldownu.
- [x] Błąd wysyłki jest widoczny w UI i umożliwia natychmiastowe ponowienie. Nie rozpoczyna nowego cooldownu.
- [x] Błąd transportu przy potwierdzaniu jest widoczny i nie jest traktowany jako sukces. Stan wysyłania lub potwierdzania nie pozostawia interfejsu trwale zablokowanego po błędzie.
- [x] Powrót do edycji kontaktu i jego zmiana unieważniają aktywne wyzwanie. Ponowne rozpoczęcie wymaga walidacji nowego kontaktu; spóźniona odpowiedź dotycząca starego wyzwania nie kończy kroku dla nowego kontaktu.
- [x] Moduł i UI rozróżniają oczekiwanie na kod, błędny kod, błąd wysyłki, weryfikację, wygaśnięcie, blokadę i sukces.
- [x] Testy używają kontrolowanego zegara i sprawdzają granice pięciu minut oraz 60 sekund bez realnego oczekiwania.
- [x] Testy obejmują pięć prób, odrzucenie poprzedniego wyzwania po ponownym wysłaniu, nowy limit prób, błędy wysyłki i potwierdzania oraz unieważnienie przy zmianie kontaktu. Reguły wspólnego modułu i mocka są sprawdzane dla `email` i `phone`.
- [x] Mock można skonfigurować do ustawienia poprawnego kodu, wymuszenia błędu wysyłki i wygaśnięcia oraz obserwacji parametrów żądań.
