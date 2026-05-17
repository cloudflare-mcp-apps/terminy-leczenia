Dokumentacja API Terminy Leczenia wersja 1.3
Informacje ogólne
Interfejs API Terminy Leczenia umożliwia dostęp do danych publicznych gromadzonych przez Narodowy Fundusz Zdrowia.

Budowa API Terminy Leczenia zrealizowana została w ramach projektu „Otwarte Dane – dostęp, standard, edukacja” w ramach programu Operacyjnego Polska Cyfrowa na lata 2014-2020.

Udostępniane dane przekazywane są do NFZ przez świadczeniodawców mających umowę o udzielanie świadczeń opieki zdrowotnej (np. szpitale, poradnie specjalistyczne).

Dane obejmują informacje o świadczeniach opieki zdrowotnej (procedury medyczne, programy lekowe, świadczenia w poradniach specjalistycznych, w oddziałach szpitalnych, w pracowniach diagnostycznych, w ośrodkach opieki pozaszpitalnej), dla których świadczeniodawcy prowadzą listy oczekujących. Informacje gromadzone w ramach list oczekujących obejmują w szczególności:


dane świadczeniodawcy,
dane o miejscach udzielania świadczeń,
liczbę osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca,
datę pierwszego wolnego terminu udzielenia świadczenia.
API Terminy Leczenia jest źródłem informacji, które mogą posłużyć do stworzenia aplikacji dedykowanych osobom korzystającym ze świadczeń opieki zdrowotnej finansowanych ze środków publicznych.

Swagger i API Terminy Leczenia
W celu ułatwienia korzystania z API Terminy Leczenia zdecydowaliśmy się dodać do dokumentacji Swagger UI. Jest to narzędzie umożliwiające w prosty sposób wizualizację i interakcję z zasobami API bez konieczności implementowania. Narzędzie dostępne jest w menu w sekcji Swagger

Zasoby
Prezentowane dane zostały podzielone na trzy główne sekcje:


Dane o terminach leczenia
Słowniki
Info
Dane o terminach leczenia
Do dyspozycj w tej sekcji są 3 zasoby: /queues, /queues/{id} oraz /many-places/{id}

/queues
Zasób zwraca listę pierwszych dostępnych terminów leczenia w zależności od wprowadzonych parametrów. Wynik żądania zgodnie ze strukturą zwraca listę obiektów queue (SwaggerUi).

Terminy leczenia

GET
/queues
/queue/{id}
Zasób dostarcza szczegółów dotyczących jednego terminu leczenia wskazanego parametrem {id}. Wynik żądania zgodnie ze strukturą zwraca obiekt queue (SwaggerUi).

Terminy leczenia

GET
/queues/{id}
/many-places/{id}
Zasób zwraca listę pierwszych wolnych terminów leczenia dla wcześniej wybranego świadczenia (poprzez parametr {id} kolejki dla której występują inne miejsca) udzielanego przez tego samego świadczeniodawcę. Wynik żądania zgodnie ze strukturą zwraca obiekt many-places (SwaggerUi).

Terminy leczenia

GET
/many-places/{id}
Słowniki
Do dyspozycj w tej sekcji jest 5 zasobów słownikowych:

benefits
localities
places
providers
streets
/benefits
Słownik nazw świadczeń opieki zdrowotnej (procedur medycznych, programów lekowych, świadczeń w poradni specjalistycznej, w oddziale szpitalnym, w pracowni diagnostycznej, w ośrodku opieki pozaszpitalnej).

Wynik żądania zgodnie ze strukturą zwraca obiekt benefit (SwaggerUi).

Słowniki

GET
/benefits
/localities
Słownik miejscowości z adresów miejsca udzielania świadczeń (szpitala/przychodni).

Wynik żądania zgodnie ze strukturą zwraca obiekt locality (SwaggerUi).

Słowniki

GET
/localities
/places
Słownik nazw miejsc udzielania świadczeń w szpitalu/przychodni.

Wynik żądania zgodnie ze strukturą zwraca obiekt place (SwaggerUi).

Słowniki

GET
/places
/providers
Słownik nazw świadczeniodawców, którzy udzielają świadczeń w ramach zawartej umowy z NFZ.

Wynik żądania zgodnie ze strukturą zwraca obiekt provider (SwaggerUi).

Słowniki

GET
/providers
/streets
Słownik nazw ulic z adresów miejsca udzielania świadczeń (szpitala/przychodni).

Wynik żądania zgodnie ze strukturą zwraca obiekt street (SwaggerUi).

Słowniki

GET
/streets
Info
W sekcji "Info" znajduje się zasób zwracający aktualną wersję API.

Info

GET
/version
Struktura danych
Dane z API zwracane są zgodnie ze standardem JSON API. W każdej odpowiedzi znajduje się co najmniej jedna z poniższych sekcji:

data
errors
meta
z zastrzeżeniem, że data i errors nie mogą wystąpić razem w jednej odpowiedzi.

links
Ponieważ zasoby zwracające listę wyników są stronicowane (25 wyników na stronę), dodatkowo w odpowiedziach dodawana jest sekcja links, ułatwiająca poruszanie się po API (HATEOAS).

Dostępnych w sekcji jest 5 linków:

first - do pierwszej strony wyników,
prev - do następnej strony wyników,
self - do aktualnej strony wyników,
next - do następnej strony wyników,
last - do ostaniej strony wyników,
Na przykład poniższe żądanie:

https://api.nfz.gov.pl/app-itl-api/queues?case=1&province=07&benefit=poradnia
zwróci listę pierwszych wolnych terminów leczenia dla świadczenia zawierającego słowo "poradnia":

{
    "meta": {
        "@context": "/schema/queue",
        "count": 4088,
        "page": 1,
        "limit": 10
    },
    "links": {
        "first": "/queues?page=1&limit=10&case=1&province=07&benefit=poradnia",
        "prev": null,
        "self": "/queues?page=1&limit=10&case=1&province=07&benefit=poradnia",
        "next": "/queues?page=2&limit=10&case=1&province=07&benefit=poradnia",
        "last": "/queues?page=409&limit=10&case=1&province=07&benefit=poradnia"
    },
    "data": [
        ...
    ]
}
    
Należy zwrócić uwagę na link prev, który nie zawiera żadnej wartości (null). Spowodowane jest to użyciem domyślnych wartości paramterów (ponieważ ich nie przekazano). Domyślnie parametr page = 1, dlatego opdowiedź z API zawiera pierwszą stronę wyników dla której poprzednia nie istnieje.

data
Sekcja data zawiera dane pasujące do kryteriów wyszukiwania. W tej sekcji możemy odnaleźć różnego rodzaju struktury w zależności od przeszukiwanego zasobu.

Przykład opowiedzi na zapytanie przeszukujące nazwy świadczeń zawierające słowo poradnia

https://api.nfz.gov.pl/app-itl-api/benefits?name=poradnia

{
  "meta": {
    "@context": "/schema/benefit",
    "count": 167,
    "page": 1,
    "limit": 10
  },
  "links": {
    "first": "/benefits?page=1&limit=10&name=poradnia",
    "prev": null,
    "self": "/benefits?page=1&limit=10&name=poradnia",
    "next": "/benefits?page=2&limit=10&name=poradnia",
    "last": "/benefits?page=17&limit=10&name=poradnia"
  },
    "data": [
        "PORADNIA ALERGOLOGICZNA",
        "PORADNIA ALERGOLOGICZNA DLA DZIECI",
        "PORADNIA ANESTEZJOLOGICZNA",
        "PORADNIA ANESTEZJOLOGICZNA DLA DZIECI",
        "PORADNIA ANTYNIKOTYNOWA",
        "PORADNIA AUDIOLOGICZNA",
        "PORADNIA AUDIOLOGICZNA DLA DZIECI",
        "PORADNIA CHIRURGII KLATKI PIERSIOWEJ",
        "PORADNIA CHIRURGII KLATKI PIERSIOWEJ DLA DZIECI",
        "PORADNIA CHIRURGII NACZYNIOWEJ"
      ]
    }
        
    
Lista wszystkich możliwych schematów zwracanych w sekcji data została opisana w osobnej sekcji dokumentacji - Schematy.

errors
Podczas pracy z API można natrafić na błędy, które w sposób zgodny ze standardem zawierają możliwie jak najwięcej informacji, ułatwiających rozwiązanie problemu.

Przykładowy błąd zwracany w przypadku gdy nie zostanie przekazany wymagany paramter (case):

{
  "errors": [
    {
      "id": "bf99b2fa-8b84-4488-9e6f-85e324dea9ff",
      "errorr-result": "Cannot return results",
      "errorr-reason": "Invalid value for {case} attribute",
      "errorr-solution": "Provide proper value for attribute",
      "error-help": "/errors/#1200007",
      "error-code": 1200007
    }
  ]
}
    
Struktura odpowiedzi została opisana w osobnej sekcji dokumentacji - Schematy.
Lista możliwych błędów została opisana w osobnej sekcji dokumentacji - Opis błędów

meta
Szczegóły dotyczące metadanych zostały opisanę w osobnej sekcji dokumentacji - Metadane

Standardowy mechanizm wyszukiwania danych
API Terminy Leczenia oferuje mechanizmy wyszukiwania z filtrowaniem pełnotekstowym po konkretnych polach oraz stronicowanie. Wszystkie parametry wyszukiwania podaje się w części query zaraz po przeszukiwanym zasobie porzedzając go znakiem pytajnika.(?)

Podaczas wyszukiwania w cześci query możemy używać standardowych pól:

page - numer strony wyników do zwrócenia. Strony numerowane są od 1. Domyślna ilość wyników na stronie opisana jest w dokumentacji Swagger UI.

limit - ilość wyników zróconych na stronie. Wartości domyślne i maksymalne zostały opisane szczegółowo w dokumentacji Swagger UI.

format - określa format zwracanych wyników. Domyślnie dane zwracane są w formacie json — JavaScript object notation.

Pozostałe pola filtrowania pełnetekstowego opisuje szczegółowo dokumentacja Swagger UI dla każdego przeszukiwanego zasobu.

Ponizej przedstawiamy przykład wywołania pobrania listy pierwszych dostępnych terminów leczenia dla przypadku stablinego, ograniczonego do województwa mazowieckiego i miasta Warszawa.

https://api.nfz.gov.pl/app-itl-api/queues?page=1&limit=10&format=json&case=1&province=07&locality=Warszawa