# BIZON CENTER — BIBLIA PROJEKTU

Wersja: 1.0
Data: 14 listopada 2026
Repozytorium: https://github.com/maruli9/bizony
Strona testowa: https://bizony.vercel.app

## WIZJA
Bizon Center to wirtualny trener badmintonisty Vienna Bizons Club. Rozwija inteligencję taktyczną, wspiera trening na hali, mierzy postępy i wskazuje, co trenować dalej.

Każda funkcja odpowiada na pytania: czego uczymy, jak mierzymy postęp i co trenować dalej. Najpierw poprawność szkoleniowa i danych, potem wygląd i rozbudowa.

## MODUŁY
Bizon Vision: misje taktyczne debla, widoki kortu 2D i uproszczone 3D.
Bizon Performance / Profil Bizona: radar, wykresy, historia i mocne oraz słabe strony.
Bizon Coach: indywidualne wskazówki i dobór kolejnych ćwiczeń.
Quick Eye Game: przyszłe ćwiczenia percepcji, koncentracji i reakcji.
Bizon Court Training: przyszłe zadania praktyczne na hali.
Ranking Vision: porównanie wyników taktycznych zawodników.
Wszystko pod jednym głównym punktem menu Bizon Center.

## 12 KOMPETENCJI
OBRONA: 1. Ustawienie obronne; 2. Odpowiedź na atak (blok, drive, lift); 3. Kontratak; 4. Asekuracja partnera.
ATAK: 5. Wybór uderzenia (smash, drop, clear, drive); 6. Gra przy siatce; 7. Rotacja w ataku; 8. Budowanie przewagi.
INTELIGENCJA GRY: 9. Serwis i odbiór; 10. Czytanie przeciwnika; 11. Decyzje pod presją; 12. Współpraca i komunikacja.

## STANDARD MISJI
Każda misja określa: kto jest Bizonem i partnerem, pozycje czterech graczy, położenie lotki, fazę wymiany, jednoznaczne pytanie, trzy logiczne odpowiedzi, klucz oceniania, uzasadnienie i mierzoną kompetencję.
Nie mieszać decyzji Bizona z przewidywanym zagraniem przeciwnika w jednym pytaniu.

## OCENIANIE
Każda odpowiedź musi aktualizować właściwą kompetencję. Zachowywać historię prób, liczbę obserwacji i poziom pewności diagnozy. Przy małej próbie pokazywać za mało danych. Nie utożsamiać wiedzy taktycznej z rzeczywistym wykonaniem na korcie ani szybkością reakcji. Ranking nie zastępuje indywidualnego rozwoju. Jedna próba rankingowa na misję, powtórki w trybie nauki bez punktów rankingowych.

## ARCHITEKTURA
Wszystkie przyszłe gry i narzędzia korzystają ze wspólnego modelu kompetencji, zdarzeń pomiarowych, historii wyników i profilu zawodnika. Nowe moduły nie powinny wymagać przebudowy radaru. Prototyp używa localStorage; wspólny ranking między urządzeniami wymaga backendu i logowania.

## OBECNY STAN
Testowa wersja bizon-center-test-v03.html została uruchomiona na Vercel. Ma misje, radar i elementy trenera, lecz nie jest jeszcze wiarygodnym narzędziem diagnostycznym. Trzeba sprawdzić wszystkie 12 misji, klucze odpowiedzi, feedback, powiązania kompetencji i obliczenia radaru.

## NASTĘPNY KROK
Najpierw audyt i testy 12 misji oraz silnika oceniania. Potem poprawa modelu danych i radaru. Dopiero następnie nowe misje, Quick Eye Game i ćwiczenia na hali.

## ZASADY WSPÓŁPRACY
Pracujemy po polsku. Użytkownik korzysta z iPhone'a 12 mini i potrzebuje instrukcji po jednym kroku. Nie usuwać działających wersji. Odróżniać plany od zweryfikowanych funkcji.

Hasło: Trenuj mądrzej, graj lepiej.

W nowym czacie: przeczytaj ten dokument i kontynuuj Bizon Center od audytu 12 misji, bez zaczynania projektu od zera.
