# Uwierzytelnianie kodem e-mail i telefonu

Status: ready-for-agent

## Problem Statement

`Application Process` ma dwa kolejne `Process Step`, w których użytkownik podaje e-mail i numer telefonu. Obecne widoki walidują kontakt lokalnie i od razu oznaczają krok jako ukończony. Nie ma wspólnego mechanizmu wysłania jednorazowego kodu, jego potwierdzenia, obsługi prób, wygaśnięcia ani przekazania wyniku uwierzytelnienia do `Process Shell`.

## Solution

Wprowadzić niezależny moduł uwierzytelniania kodem jednorazowym, używany przez oba istniejące widoki weryfikacji. Moduł będzie obsługiwał zamknięty zestaw kanałów `email` i `phone`, będzie otrzymywał już zwalidowany kontakt oraz `applicationId`, a komunikację z backendem ukryje za adapterem.

Po poprawnej walidacji kontaktu widok rozpocznie wyzwanie. Użytkownik otrzyma kod, wpisze go w tym samym `Process Step` i jawnie potwierdzi. Sukces zwróci nieprzezroczysty `verificationToken`; widok przekaże go do `Process Shell`, który zapisze wynik i ukończy odpowiedni krok. W bieżącym procesie najpierw zostanie potwierdzony e-mail, a następnie telefon.

## User Stories

1. Jako użytkownik chcę potwierdzić dostęp do mojego adresu e-mail kodem jednorazowym, aby uwierzytelnić się w procesie.
2. Jako użytkownik chcę potwierdzić dostęp do mojego numeru telefonu kodem jednorazowym, aby uwierzytelnić się w procesie.
3. Jako użytkownik chcę otrzymać kod dopiero po poprawnym podaniu kontaktu i kliknięciu „Dalej”, aby przypadkowe renderowanie widoku nie wysyłało wiadomości.
4. Jako użytkownik chcę widzieć, na jaki zamaskowany kontakt wysłano kod, aby wiedzieć, gdzie go szukać.
5. Jako użytkownik chcę wpisać sześciocyfrowy kod i jawnie kliknąć „Potwierdź”, aby kontrolować moment weryfikacji.
6. Jako użytkownik chcę otrzymać jasny komunikat po wpisaniu niepoprawnego kodu, aby móc spróbować ponownie.
7. Jako użytkownik chcę mieć maksymalnie pięć prób dla jednego wyzwania, aby błędne wpisanie kodu było możliwe bez natychmiastowej blokady.
8. Jako użytkownik chcę, aby po przekroczeniu limitu prób wyzwanie zostało zablokowane i wymagało rozpoczęcia nowego.
9. Jako użytkownik chcę, aby kod wygasł po pięciu minutach, aby stare kody nie pozostawały aktywne.
10. Jako użytkownik chcę zobaczyć informację o wygaśnięciu kodu i rozpocząć nowe wyzwanie bez opuszczania widoku.
11. Jako użytkownik chcę ponownie wysłać kod po 60 sekundach, aby ograniczyć przypadkowe wielokrotne wysyłki.
12. Jako użytkownik chcę, aby poprzedni kod przestał działać po ponownym wysłaniu, aby aktywny był tylko najnowszy kod.
13. Jako użytkownik chcę otrzymać możliwość ponowienia wysyłki po błędzie transportu, aby chwilowa awaria nie blokowała procesu.
14. Jako użytkownik chcę, aby zmiana kontaktu unieważniła poprzednie wyzwanie, aby kod wysłany na stary kontakt nie mógł zostać użyty.
15. Jako użytkownik chcę najpierw potwierdzić e-mail, a potem telefon, aby `Application Process` zachował obecną kolejność kroków.
16. Jako użytkownik chcę, aby po potwierdzeniu e-maila przejść do kroku telefonu, a po potwierdzeniu telefonu do panelu.
17. Jako użytkownik chcę otrzymać zrozumiałą informację o błędzie wysyłki, błędnym kodzie, wygaśnięciu i blokadzie.
18. Jako użytkownik korzystający z klawiatury chcę obsłużyć formularz kodu bez automatycznego wysyłania po wpisaniu ostatniej cyfry.
19. Jako użytkownik chcę, aby odświeżenie strony rozpoczynało stan procesu od nowa, ponieważ wyzwanie jest przechowywane wyłącznie w pamięci.

## Implementation Decisions

- Powstanie dedykowana funkcjonalność autoryzacji kodem, niezależna od konkretnego widoku e-maila i telefonu.
- Zostanie użyty jeden wspólny komponent UI osadzany w obu widokach. Widoki pozostaną odpowiedzialne za walidację kontaktu, rozpoczęcie wyzwania, routing i przekazanie sukcesu do `Process Shell`.
- Moduł otrzyma `applicationId`, kanał (`email` albo `phone`), już zwalidowany i znormalizowany kontakt oraz adapter.
- Adapter będzie ukrywał transport i docelową komunikację z backendem. W pierwszej wersji jego implementacja będzie oparta o mockowane endpointy MSW.
- Publiczny kontrakt adaptera będzie rozdzielał żądanie kodu od jego potwierdzenia. Żądanie kodu przyjmie `applicationId`, kanał i kontakt, a zwróci identyfikator wyzwania, czas wygaśnięcia i czas dostępności ponownego wysłania. Potwierdzenie przyjmie `applicationId`, identyfikator wyzwania i kod, a po sukcesie zwróci `verificationToken`.
- Ponowne wysłanie użyje tej samej operacji żądania kodu. Po sukcesie utworzy nowe wyzwanie i unieważni poprzednie.
- Kod będzie miał sześć cyfr i nie będzie mógł zaczynać się od zera. Generowanie i sprawdzanie kodu pozostanie odpowiedzialnością adaptera/backendu, nie komponentu.
- Moduł będzie posiadał stany odpowiadające co najmniej: bezczynności, wysyłaniu, oczekiwaniu na kod, weryfikacji, błędowi wysyłki, błędnemu kodowi, wygaśnięciu, blokadzie i sukcesowi.
- Cooldown 60 sekund zablokuje wyłącznie ponowne wysłanie kodu. Wpisywanie i sprawdzanie aktualnego kodu pozostanie możliwe.
- Cooldown rozpocznie się tylko po udanym wysłaniu. Błąd wysyłki pozwoli na natychmiastową próbę ponowienia.
- Limit pięciu prób będzie obowiązywał dla jednego wyzwania. Nowe wyzwanie rozpocznie nowy limit prób.
- Wygaśnięcie po pięciu minutach i limit prób będą egzekwowane przez backend. Frontend będzie wyświetlał licznik i reagował na wynik adaptera, ale nie będzie źródłem prawdy.
- Stan wyzwania będzie przechowywany w pamięci. Odświeżenie strony nie będzie przywracało aktywnego wyzwania.
- Zmiana kontaktu unieważni aktywne wyzwanie i rozpocznie nowy cykl po ponownej walidacji.
- Komponent nie będzie automatycznie wysyłał kodu podczas montowania ani automatycznie potwierdzał kodu po wpisaniu ostatniej cyfry. Wysyłka i potwierdzenie będą jawne.
- Po sukcesie komponent opublikuje wynik zawierający `verificationToken`. Widok przekaże wynik do `Process Shell`, który zapisze token i oznaczy odpowiedni `Process Step` jako ukończony.
- `Process Shell` pozostanie właścicielem kolejności kroków: e-mail, telefon, panel. Moduł autoryzacyjny nie będzie zarządzał routingiem ani decyzją, czy wymagane są oba kanały.
- Adapter mockowy umożliwi ustawienie poprawnego kodu, wymuszenie błędu wysyłki, wymuszenie wygaśnięcia i sprawdzenie parametrów żądań. Zegar będzie możliwy do wstrzyknięcia w testach.

## Testing Decisions

- Testy będą sprawdzać zachowanie przez publiczny kontrakt modułu i komponentu, a nie prywatne pola ani szczegóły implementacji.
- Głównym seamem będzie publiczny moduł autoryzacyjny z wstrzykiwanym adapterem. Testy przejdą przez rozpoczęcie wyzwania, potwierdzenie kodu, ponowienie wysyłki, cooldown, limit prób, wygaśnięcie, blokadę i sukces.
- Testy modułu obejmą oba kanały, poprawny i niepoprawny kod, kod z zerem poza pierwszą pozycją, błędy adaptera, unieważnienie poprzedniego wyzwania oraz zmianę kontaktu.
- Testy użyją kontrolowanego zegara, aby sprawdzać pięć minut ważności i 60 sekund cooldownu bez oczekiwania w czasie rzeczywistym.
- Testy adaptera MSW sprawdzą, że moduł wysyła `applicationId`, kanał, kontakt, identyfikator wyzwania i kod w odpowiednich operacjach.
- Testy komponentu sprawdzą widoczne stany, komunikaty, zamaskowanie kontaktu, blokowanie przycisków i jawne potwierdzanie kodu.
- Test integracyjny sprawdzi, że widok e-maila i widok telefonu przekazują sukces do `Process Shell`, a ten zapisuje token i zmienia status właściwego kroku.
- Testy integracyjne zachowają obecną kolejność: ukończenie e-maila odblokowuje telefon, a ukończenie telefonu odblokowuje panel.
- Zostaną wykorzystane istniejące wzorce testów `ProcessController`, komponentów Lit i mockowania HTTP przez MSW.
- Testy nie będą zależne od prawdziwego dostawcy e-mail/SMS, sieci ani rzeczywistego czasu.

## Out of Scope

- Implementacja prawdziwego backendu i integracji z dostawcą e-mail/SMS.
- Tworzenie sesji logowania, refresh tokenów, zarządzania kontem lub pełnego systemu tożsamości poza zwróceniem `verificationToken`.
- Wybór alternatywnego kanału w aktywnym wyzwaniu.
- Konfigurowalna polityka wymagająca jednego albo obu kanałów; bieżący proces wymaga obu, a moduł obsługuje pojedynczy kanał na jedno wyzwanie.
- Przywracanie wyzwania po odświeżeniu strony.
- Lokalizacja wszystkich komunikatów i rozbudowany system design systemu poza interfejsem potrzebnym do obsługi przepływu.
- Automatyczne wysyłanie lub automatyczne potwierdzanie kodu.
- Przechowywanie poprawnego kodu po stronie komponentu lub modułu frontendowego.

## Further Notes

- Obecne widoki weryfikacji kończą kroki po samej walidacji kontaktu. Spec wymaga rozdzielenia walidacji kontaktu od uwierzytelnienia kodem.
- `Process Shell` zachowuje odpowiedzialność za statusy `Process Step`, ochronę tras i przejście do kolejnego kroku.
- Nazwa „uwierzytelnienie kodem” opisuje cel modułu, natomiast istniejące nazwy kroków e-mail i telefonu mogą pozostać bez zmian dla zachowania obecnego modelu procesu.
- Po tej specyfikacji można rozbić pracę na tickety pionowe. Najpierw powinien powstać kontrakt modułu i adaptera, następnie komponent, potem integracja obu kroków i weryfikacja całego procesu.
