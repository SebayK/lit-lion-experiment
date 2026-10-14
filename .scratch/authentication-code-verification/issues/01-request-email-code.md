# 01: Wyślij kod na e-mail

**What to build:** Po poprawnej walidacji e-maila i kliknięciu „Dalej” użytkownik otrzymuje kod przez mock HTTP i widzi niezależny, wspólny komponent do wpisania kodu z zamaskowanym kontaktem. Wysyłka przechodzi przez adapter modułu uwierzytelniania. Samo podanie kontaktu ani wysłanie kodu nie kończy `Process Step`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Implementation status:** completed (commit `3aedd1b`).

Specyfikacja: [Uwierzytelnianie kodem e-mail i telefonu](../spec.md).

- [x] Moduł uwierzytelniania jest samodzielnym feature z logiką niezależną od DOM, cienkim komponentem Lit i wstrzykiwanym adapterem. Komponent nie zależy od `Process Shell` ani routingu.
- [x] Kontrakt modułu obsługuje zamknięte kanały `email` i `phone`; ten ticket integruje przepływ wysyłki dla e-maila.
- [x] `Application Process` otrzymuje identyfikator `applicationId`, stały przez czas bieżącego procesu w pamięci. Reset procesu tworzy nowy identyfikator. Moduł otrzymuje go od rodzica.
- [x] Istniejący widok e-maila waliduje i normalizuje kontakt przed jawnym wywołaniem `start()`. Niepoprawny kontakt nie powoduje żądania HTTP.
- [x] Adapter udostępnia operację żądania kodu z `applicationId`, kanałem i kontaktem. Mock HTTP jest zarejestrowany w uruchamianej aplikacji i zwraca `challengeId`, `expiresAt` oraz `resendAvailableAt`, odpowiadające pięciu minutom ważności i 60 sekundom cooldownu.
- [x] Poprawny kod mocka jest konfigurowany poza modułem i komponentem. Ma sześć cyfr i nie zaczyna się od zera; komponent ani frontendowy moduł stanu nie otrzymuje poprawnego kodu w odpowiedzi.
- [x] Stan wyzwania jest przechowywany w module niezależnie od montowania komponentu. Rodzic przekazuje instancję modułu do komponentu; montowanie i renderowanie nie wysyła kodu.
- [x] Podczas wysyłania interfejs pokazuje postęp i blokuje powtórzenie żądania. Po sukcesie pokazuje zamaskowany e-mail, pole kodu i przycisk „Potwierdź”.
- [x] Wysłanie kodu pozostawia krok e-maila nieukończony i nie odblokowuje kroku telefonu.
- [x] Testy przez publiczny kontrakt i UI potwierdzają poprawne parametry żądania, przejście do wpisywania kodu, brak wysyłki przy niepoprawnym kontakcie i renderowaniu oraz brak podwójnego żądania podczas wysyłania.
