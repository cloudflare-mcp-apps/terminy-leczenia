Metadane
Do każdego poprawnego wyniku żądania HTTP (bez błędów) dodawane są metadane. W dużym uproszeniu są to dane opisujące dane. Należą one do jednego z trzech głównych elementów zwracanych w opdowiedzi na zapytania (data, errors, meta).

Dostępne są następujące rodzaje metadanych:

@context
count
page
limit
title
url
provider
date-published
date-modified
description
keywords
language
content-type
is-part-of
message
@context
Pole zawiera adres url pod którym znajdują się szczegółowe informację dotyczące schematu dla zwracanego wyniku.

https://api.nfz.gov.pl/app-itl-api/queues?case=1&province=07&benefit=poradnia
{
    "meta": {
    "@context": "https://api.nfz.gov.pl/schemas/queue",
        ...
    },
    "links": {
        "first": "/queues?page=1&limit=10&case=1&province=07&benefit=poradnia",
        "prev": null,
        "self": "/queues?page=1&limit=10&case=1&province=07&benefit=poradnia",
        "next": "/queues?page=2&limit=10&case=1&province=07&benefit=poradnia",
        "last": "/queues?page=407&limit=10&case=1&province=07&benefit=poradnia"
    },
    "data": [
        
    ]
}
count
Zasoby zwracające listę wyników (np. zasób /queues/{id} nie zwróci tej metadanej) są stronicowane, dlatego w odpowiedzi na te żądania, zwracana jest liczba wszystkich znalezionych wyników w polu count. Na przykład:

https://api.nfz.gov.pl/app-itl-api/localities?name=war&province=07
zwróci listę miejscowości/dzielnic pasujących do parametrów wyszukiwania:

{
    "meta": {
        ...
    "count": 20,
        ...
    },
    "links": {
        "first": "/localities?page=1&limit=10&name=war",
        "prev": null,
        "self": "/localities?page=1&limit=10&name=war",
        "next": "/localities?page=2&limit=10&name=war",
        "last": "/localities?page=2&limit=10&name=war"
    },
    "data": [
        ...
    ]
}
page
Tak jak w przypadku count metadana page jest zwracana tylko dla zasobów zwracających listę wyników. Określa ona przesunięcie (offset), w widoku danych. Na przykład:

https://api.nfz.gov.pl/app-itl-api/benefits?name=alko&province=07&page=2
zwróci drugą stronę listy świadczeń pasujących do parametrów wyszukiwania:

{
    "meta": {
        ...
    "page": 2,
        ...
  },
    "links": {
        "first": "/benefits?page=1&limit=10&name=alko",
        "prev": "/benefits?page=1&limit=10&name=alko",
        "self": "/benefits?page=2&limit=10&name=alko",
        "next": null,
        "last": "/benefits?page=2&limit=10&name=alko"
    },
    "data": [
        ...
    ]
}
limit
Metadana limit tak samo jak count i page zwracana jest tylko dla zasobów zawierających listę wyników. Określa ona liczbę wyników zwracanych na jednej stronie. Na przykład:

https://api.nfz.gov.pl/app-itl-api/benefits?name=poradnia&province=07&limit=20
zwróci listę świadczeń pasujących do parametrów wyszukiwania (20 wyników na stonę):

{
    "meta": {
        ...
    "limit": 20
        ...
    },
    "links": {
        "first": "/benefits?page=1&limit=20&name=poradnia",
        "prev": null,
        "self": "/benefits?page=1&limit=20&name=poradnia",
        "next": "/benefits?page=2&limit=20&name=poradnia",
        "last": "/benefits?page=9&limit=20&name=poradnia"
    },
    "data": [
        ...
    ]
}
title
Nazwa zasobu informacyjnego, która umożliwia jego identyfikację. Na przykład słownik ulic:

https://api.nfz.gov.pl/app-itl-api/streets?name=warszawska
{
    "meta": {
        ...
    "title": "streets"
        ...
    },
    "links": {
        "first": "/streets?page=1&name=warszawska",
        "prev": null,
        "self": "/streets?page=1&name=warszawska",
        "next": "/streets?page=2&name=warszawska",
        "last": "/streets?page=9&name=warszawska"
    },
    "data": [
        ...
    ]
}
url
Identyfikator lokalizacji do pobrania zasobu informacyjnego w przypadku, gdy stanowi osobny plik.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "url": "https://api.nfz.gov.pl/app-itl-api//schema/queue"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
provider
Opis dostawcy zasobu informacyjnego - Narodowy Fundusz Zdrowia.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "provider": "Narodowy Fundusz Zdrowia"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
date-published
Data i czas publikacji zasobu, z dokładnością do jednej sekundy. Data i czas zgodnie ze standardem ISO-8601.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "date-published": "2019-02-26T10:49:23+01:00"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
date-modified
Data ostatniej modyfikacji zasobu z dokładnością do jednej sekundy. Data i czas zgodnie ze standardem ISO-8601.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "date-published": 2019-02-28T08:16:51+01:00
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
description
Opis zasobu informacyjnego.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "description": "Zasób zwraca pierwszy dostępny termin leczenia dla każdego świadczenia medycznego zgodnie z wybranymi parametrami wyszukiwania. Odpowiedź zawiera szczegółowe informacje  oraz listę świadczeń medycznych we właściwej kolejności wyświetlania (według pierwszej dostępnej daty leczenia)"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
keywords
Słowa kluczowe, czyli zestaw słów lub wyrażeń zwięźle opisujących zasób informacyjny.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "keywords": "kolejki,terminy leczenia,Narodowy Fundusz Zdrowia,termin,lekarz,poradnia,przychodnia,leczenie,terminy,wolne terminy"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
language
Określa język zasobu.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "language": "PL"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
content-type
Określa informację o rodzaju zasobu i jego kodowaniu.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "content-type": "application/json; charset=utf-8"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
is-part-of
Określenie przynależności do grupy np. zasobów.

https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
    "is-part-of": "Terminy Leczenia"
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
message
Aktualny komunikat dla Informatora o Terminach Leczenia.
Zwraca obiekt z 2 właściowściami:

type - typ komunikatu:
I - informacja
O - ostrzeżenie
conent - treść komunikatu.
https://api.nfz.gov.pl/app-itl-api/queues?province=07
{
    "meta": {
        ...
        "message": {
            "type": "I",
            "content": "Informacja"
        },
        ...
    },
    "links": {
        "first": "/queues?province=07",
        "prev": null,
        "self": "/queues?province=07",
        "next": "/queues?province=07",
        "last": "/queues?province=07"
    },
    "data": [
        ...
    ]
}
