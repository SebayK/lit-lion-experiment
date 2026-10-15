# 04: Potwierdź telefon tym samym komponentem

**What to build:** Po potwierdzeniu e-maila użytkownik podaje numer telefonu, otrzymuje kod i potwierdza go przy użyciu tego samego niezależnego modułu oraz komponentu. `Process Shell` zapisuje osobny wynik telefonu i odblokowuje panel dopiero po sukcesie obu kroków.

**Blocked by:** 02 — Potwierdź kod e-mail i ukończ krok.

**Status:** completed

**Implementation status:** completed (commit includes issue 03's shared challenge rules).

Specyfikacja: [Uwierzytelnianie kodem e-mail i telefonu](../spec.md).

- [x] Widok telefonu waliduje i normalizuje numer, a następnie po kliknięciu „Dalej” rozpoczyna wyzwanie z kanałem `phone`, kontaktem i tym samym `applicationId`, którego używa krok e-maila.
- [x] Niepoprawny numer nie powoduje wysyłki. Montowanie, renderowanie i wpisanie ostatniej cyfry kodu nie uruchamiają automatycznych requestów.
- [x] Widok osadza ten sam komponent i moduł co widok e-maila. Komponent pokazuje zamaskowany numer i teksty odpowiednie dla telefonu; wspólna logika wyzwania nie jest kopiowana do widoku.
- [x] Adapter i mock HTTP obsługują żądanie i potwierdzenie kodu dla `phone`. Wyzwanie telefonu i wynik e-maila są rozróżniane, aby sukces jednego kanału nie potwierdzał drugiego.
- [x] Udana weryfikacja telefonu emituje wynik do rodzica. `ProcessController` zapisuje telefon i jego `verificationToken` oddzielnie od tokenu e-maila, po czym kończy właściwy `Process Step`.
- [x] Samo poprawne podanie telefonu lub wysłanie kodu nie kończy kroku telefonu. Po sukcesie następuje przejście do panelu.
- [x] Ochrona tras wymaga potwierdzenia e-maila przed dostępem do telefonu oraz ukończenia obu kroków przed dostępem do panelu.
- [x] Stan wyzwań i oba tokeny są przechowywane wyłącznie w pamięci; reset procesu i odświeżenie strony nie przywracają ukończonych weryfikacji.
- [x] Testy modułu, UI, adaptera i integracji procesu przechodzą przez oba kanały w kolejności e-mail → telefon → panel oraz sprawdzają izolację ich wyników.
- [x] Integracja telefonu automatycznie korzysta ze wspólnych reguł wyzwania dodawanych w tickecie 03. Ticket 03 nie blokuje tej pracy: wspólne API i przepływ sukcesu są dostępne po tickecie 02.
