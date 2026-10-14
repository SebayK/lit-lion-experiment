# 02: Potwierdź kod e-mail i ukończ krok

**What to build:** Użytkownik wpisuje otrzymany kod e-mail i jawnie klika „Potwierdź”. Udana odpowiedź mocka HTTP zwraca wynik uwierzytelnienia, który widok przekazuje do `Process Shell`. Dopiero wtedy krok e-maila zostaje ukończony i użytkownik przechodzi do kroku telefonu.

**Blocked by:** 01 — Wyślij kod na e-mail.

**Status:** ready-for-agent

**Implementation status:** completed (commit `0a395bb`; browser fetch binding fix in `bb6f35d`).

Specyfikacja: [Uwierzytelnianie kodem e-mail i telefonu](../spec.md).

- [x] Adapter udostępnia operację potwierdzenia kodu z `applicationId`, `challengeId` i kodem. Mock HTTP sprawdza kod dla wskazanego wyzwania i aplikacji; po sukcesie zwraca nieprzezroczysty `verificationToken`.
- [x] Użytkownik potwierdza kod jawnie. Wpisanie ostatniej cyfry nie powoduje automatycznej weryfikacji.
- [x] Pole przyjmuje sześć cyfr. Kod zaczynający się od zera lub mający niepoprawny format nie jest wysyłany do adaptera; zero na dalszej pozycji jest dozwolone.
- [x] Podczas potwierdzania interfejs pokazuje stan weryfikacji i blokuje równoległe potwierdzenia tego samego wyzwania.
- [x] Niepoprawny kod powoduje czytelny komunikat i umożliwia kolejną próbę w aktywnym wyzwaniu. Błąd nie kończy `Process Step` i nie emituje wyniku sukcesu.
- [x] Po sukcesie wspólny komponent emituje wynik zawierający `verificationToken`; routing i ukończenie kroku należą do widoku oraz `Process Shell`.
- [x] `ProcessController` zapisuje kontakt oraz token e-maila w stanie procesu i oznacza krok jako ukończony dopiero po sukcesie. Sama walidacja kontaktu i wysłanie kodu nie kończą kroku.
- [x] Sukces e-maila odblokowuje krok telefonu i powoduje nawigację do niego; panel pozostaje zablokowany do czasu ukończenia telefonu.
- [x] Reset procesu usuwa token e-maila, wynik uwierzytelnienia i stan wyzwania. Dane pozostają wyłącznie w pamięci.
- [x] Testy publicznego modułu, komponentu i adaptera obejmują sukces, niepoprawny kod, kod z zerem wewnątrz oraz odrzucony format, bez sieci zewnętrznej.
- [x] Test integracyjny obejmuje wpisanie kontaktu, żądanie i potwierdzenie kodu, zapis tokenu przez `ProcessController` oraz odblokowanie telefonu wyłącznie po sukcesie.
- [x] Formularz ma dostępne etykiety i komunikaty oraz daje się obsłużyć klawiaturą.
