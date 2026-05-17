Swagger v1.3
Terminy leczenia

GET
/queues
Zasób zwraca pierwszy dostępny termin leczenia dla każdego świadczenia medycznego zgodnie z wybranymi parametrami wyszukiwania. Odpowiedź zawiera szczegółowe informacje oraz listę świadczeń medycznych we właściwej kolejności wyświetlania (według pierwszej dostępnej daty leczenia)

Parameters
Name	Description
page
integer($int32)
(query)
Określa aktualnie wyświetlaną stronę.

Default value : 1

limit
integer($int32)
(query)
Określa liczbę pozycji wyświetlanych na stronie (maks. 25)

Default value : 10

format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation
xml — Extensible markup language

Default value : json

case
integer($int32)
(query)
Przypadek (1-stabilny, 2-pilny)

Default value : 1

province
string
(query)
Kod województwa
Dostępne wartości:
01 – dolnośląskie
02 – kujawsko-pomorskie
03 – lubelskie
04 – lubuskie
05 - łódzkie
06 – małopolskie
07 – mazowieckie
08 – opolskie
09 – podkarpackie
10 – podlaskie
11 – pomorskie
12 – śląskie
13 – świętokrzyskie
14 – warmińsko-mazurskie
15 – wielkopolskie
16 – zachodniopomorskie

Default value :

benefit
string
(query)
Nazwa świadczenia określonego przez NFZ (maks. 250 znaków)

Default value :

benefitForChildren
boolean
(query)
Miejsca w ramach których udzielane są świadczenia dzieciom
(filtrowanie na podstawie kodu specjalności komórki bądź znacznika przekazanego przez świadczeniodawcę)
Dostępne wartości:
true - tylko miejsca w ramach których udzielane są świadczenia dzieciom
false - wszystkie miejsca udzielania świadczeń

Default value : false

provider
string
(query)
Nazwa świadczeniodawcy (maks. 250 znaków)

Default value :

place
string
(query)
Nazwa miejsca udzielania świadczeń (maks. 250 znaków)

Default value :

street
string
(query)
Nazwa ulicy miejsca udzielania świadczeń (maks. 250 znaków)

Default value :

locality
string
(query)
Nazwa miejscowości miejsca udzielania świadczeń (maks. 250 znaków)

Default value :

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Lista pierwszych wolnych terminów leczenia określonych parametrami wyszukiwania

Example Value
Model
{
  "meta": {
    "context": "string",
    "count": 0,
    "title": "string",
    "page": 0,
    "url": "string",
    "limit": 0,
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "links": {
    "first": "string",
    "prev": "string",
    "self": "string",
    "next": "string",
    "last": "string"
  },
  "data": [
    {
      "type": "string",
      "id": "string",
      "attributes": {
        "case": 0,
        "benefit": "string",
        "anesthesia": "string",
        "many-places": "string",
        "provider": "string",
        "provider-code": "string",
        "regon-provider": "string",
        "nip-provider": "string",
        "teryt-provider": "string",
        "place": "string",
        "address": "string",
        "locality": "string",
        "phone": "string",
        "teryt-place": "string",
        "registry-number": "string",
        "id-resort-part-VII": "string",
        "id-resort-part-VIII": "string",
        "benefits-for-children": "string",
        "age-range": "string",
        "covid-19": "string",
        "toilet": "string",
        "ramp": "string",
        "car-park": "string",
        "elevator": "string",
        "latitude": 0,
        "longitude": 0,
        "statistics": {
          "provider-data": {
            "awaiting": 0,
            "removed": 0,
            "average-period": 0,
            "update": "string"
          },
          "computed-data": {
            "average-period": 0,
            "update": "string"
          }
        },
        "dates": {
          "applicable": true,
          "date": "2026-05-17T17:28:26.037Z",
          "date-situation-as-at": "2026-05-17T17:28:26.037Z"
        },
        "benefits-provided": {
          "type-of-benefit": 0,
          "year": 0,
          "amount": 0
        }
      }
    }
  ]
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
GET
/queues/{id}
Zasób zwraca informacje o wybranym świadczeniu medycznym z listy wyświetlanej w wyniku wyszukiwania zgodnie z wybranymi parametrami wyszukiwania. Wynik zawiera szczegółowe informacje o leczeniu i datę pierwszej dostępnej daty leczenia.

Parameters
Name	Description
id *
string($uuid)
(path)
Unikalny identyfikator terminu leczenia
format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation
xml — Extensible markup language

Default value : json

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Szczegółowe informacje na temat wybranego świadczenia i daty pierwszej wolnego terminu leczenia.

Example Value
Model
{
  "meta": {
    "context": "string",
    "count": 0,
    "title": "string",
    "page": 0,
    "url": "string",
    "limit": 0,
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "links": {
    "first": "string",
    "prev": "string",
    "self": "string",
    "next": "string",
    "last": "string"
  },
  "data": [
    {
      "type": "string",
      "id": "string",
      "attributes": {
        "case": 0,
        "benefit": "string",
        "anesthesia": "string",
        "many-places": "string",
        "provider": "string",
        "provider-code": "string",
        "regon-provider": "string",
        "nip-provider": "string",
        "teryt-provider": "string",
        "place": "string",
        "address": "string",
        "locality": "string",
        "phone": "string",
        "teryt-place": "string",
        "registry-number": "string",
        "id-resort-part-VII": "string",
        "id-resort-part-VIII": "string",
        "benefits-for-children": "string",
        "age-range": "string",
        "covid-19": "string",
        "toilet": "string",
        "ramp": "string",
        "car-park": "string",
        "elevator": "string",
        "latitude": 0,
        "longitude": 0,
        "statistics": {
          "provider-data": {
            "awaiting": 0,
            "removed": 0,
            "average-period": 0,
            "update": "string"
          },
          "computed-data": {
            "average-period": 0,
            "update": "string"
          }
        },
        "dates": {
          "applicable": true,
          "date": "2026-05-17T17:28:26.039Z",
          "date-situation-as-at": "2026-05-17T17:28:26.039Z"
        },
        "benefits-provided": {
          "type-of-benefit": 0,
          "year": 0,
          "amount": 0
        }
      }
    }
  ]
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
GET
/many-places/{id}
Zasób zwraca listę dotyczącą wcześniej wybranego świadczenia z pierwszymi dostępnymi terminami leczenia, które dostarcza ten sam podmiot świadczący opiekę zdrowotną

Parameters
Name	Description
id *
string($uuid)
(path)
Unikalny identyfikator terminu leczenia
format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation
xml — Extensible markup language

Default value : json

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Lista pierwszych wolnych terminów leczenia dla wybranego

Example Value
Model
{
  "meta": {
    "context": "string",
    "title": "string",
    "url": "string",
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "data": {
    "type": "string",
    "attributes": {
      "benefit": "string",
      "provider": "string",
      "places": [
        {
          "id": "string",
          "type": "string",
          "attributes": {
            "place": "string",
            "address": "string",
            "locality": "string",
            "phone": "string",
            "teryt-place": "string",
            "id-resort-part-VII": "string",
            "id-resort-part-VIII": "string",
            "benefits-for-children": "string",
            "age-range": "string",
            "anesthesia": "string",
            "covid-19": "string",
            "toilet": "string",
            "ramp": "string",
            "car-park": "string",
            "elevator": "string",
            "latitude": 0,
            "longitude": 0,
            "statistics": {
              "provider-data": {
                "awaiting": 0,
                "removed": 0,
                "average-period": 0,
                "update": "string"
              },
              "computed-data": {
                "average-period": 0,
                "update": "string"
              }
            },
            "dates": {
              "applicable": true,
              "date": "2026-05-17T17:28:26.040Z",
              "date-situation-as-at": "2026-05-17T17:28:26.040Z"
            }
          }
        }
      ]
    }
  }
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
Słowniki

GET
/places
Zasób zwraca nazwy miejsc udzielania świadczeń zdrowotnych wybranych z bazy danych z nazwami miejsc, które zawierają pozycje dostarczane przez podmioty świadczące opiekę zdrowotną. Lista miejsc jest wynikiem wyszukiwania według przekazanych parametrów.

Parameters
Name	Description
page
integer($int32)
(query)
Określa aktualnie wyświetlaną stronę.

Default value : 1

limit
integer($int32)
(query)
Określa liczbę pozycji wyświetlanych na stronie (maks. 25)

Default value : 10

format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation (default)
xml — Extensible markup language

Default value : json

name
string
(query)
Nazwa miejsca udzielania świadczeń (maks. 250 znaków)

Default value :

province
string
(query)
Kod województwa
Dostępne wartości:
01 – dolnośląskie
02 – kujawsko-pomorskie
03 – lubelskie
04 – lubuskie
05 - łódzkie
06 – małopolskie
07 – mazowieckie
08 – opolskie
09 – podkarpackie
10 – podlaskie
11 – pomorskie
12 – śląskie
13 – świętokrzyskie
14 – warmińsko-mazurskie
15 – wielkopolskie
16 – zachodniopomorskie

Default value :

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Lista nazw miejsc udzielania świadczeń

Example Value
Model
{
  "meta": {
    "context": "string",
    "count": 0,
    "title": "string",
    "page": 0,
    "url": "string",
    "limit": 0,
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "links": {
    "first": "string",
    "prev": "string",
    "self": "string",
    "next": "string",
    "last": "string"
  },
  "data": [
    "string"
  ]
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
GET
/localities
Zasób zwraca nazwy miejscowości miejsc udzielania świadczeń zdrowotnych wybranych z bazy danych z nazwami miejsc, które zawierają pozycje dostarczane przez podmioty świadczące opiekę zdrowotną. Lista miejsc jest wynikiem wyszukiwania według przekazanych parametrów.

Parameters
Name	Description
page
integer($int32)
(query)
Określa aktualnie wyświetlaną stronę.

Default value : 1

limit
integer($int32)
(query)
Określa liczbę pozycji wyświetlanych na stronie (maks. 25)

Default value : 10

format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation (default)
xml — Extensible markup language

Default value : json

name
string
(query)
Nazwa miejscowości miejsca udzielania świadczeń (maks. 250 znaków)

Default value :

province
string
(query)
Kod województwa
Dostępne wartości:
01 – dolnośląskie
02 – kujawsko-pomorskie
03 – lubelskie
04 – lubuskie
05 - łódzkie
06 – małopolskie
07 – mazowieckie
08 – opolskie
09 – podkarpackie
10 – podlaskie
11 – pomorskie
12 – śląskie
13 – świętokrzyskie
14 – warmińsko-mazurskie
15 – wielkopolskie
16 – zachodniopomorskie

Default value :

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Lista nazw meijscowości miejsc udzielania świadczeń

Example Value
Model
{
  "meta": {
    "context": "string",
    "count": 0,
    "title": "string",
    "page": 0,
    "url": "string",
    "limit": 0,
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "links": {
    "first": "string",
    "prev": "string",
    "self": "string",
    "next": "string",
    "last": "string"
  },
  "data": [
    "string"
  ]
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
GET
/benefits
Zasób zwraca nazwy świadczeń zdrowotnych wybranych z bazy danych z nazwami świadczeń zdefiniowanych przez NFZ. Lista świadczeń jest wynikiem wyszukiwania według przekazanych parametrów.

Parameters
Name	Description
page
integer($int32)
(query)
Określa aktualnie wyświetlaną stronę.

Default value : 1

limit
integer($int32)
(query)
Określa liczbę pozycji wyświetlanych na stronie (maks. 25)

Default value : 10

format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation (default)
xml — Extensible markup language

Default value : json

name
string
(query)
Nazwa świadczenia (maks. 250 znaków)

Default value :

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Lista nazw miejsc udzielania świadczeń

Example Value
Model
{
  "meta": {
    "context": "string",
    "count": 0,
    "title": "string",
    "page": 0,
    "url": "string",
    "limit": 0,
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "links": {
    "first": "string",
    "prev": "string",
    "self": "string",
    "next": "string",
    "last": "string"
  },
  "data": [
    "string"
  ]
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
GET
/providers
Zasób zwraca nazwy świadczeniodawców wybranych z bazy danych z nazwami świadczeniodawców, która zawiera wszystkie podmioty zobligowane do raportowania listy pierwszych wolnych terminów leczenia. Lista świadczeniodawców jest wynikiem wyszukiwania według przekazanych parametrów.

Parameters
Name	Description
page
integer($int32)
(query)
Określa aktualnie wyświetlaną stronę.

Default value : 1

limit
integer($int32)
(query)
Określa liczbę pozycji wyświetlanych na stronie (maks. 25)

Default value : 10

format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation (default)
xml — Extensible markup language

Default value : json

name
string
(query)
Nazwa świadczeniodawcy (maks. 250 znaków)

Default value :

province
string
(query)
Kod województwa
Dostępne wartości:
01 – dolnośląskie
02 – kujawsko-pomorskie
03 – lubelskie
04 – lubuskie
05 - łódzkie
06 – małopolskie
07 – mazowieckie
08 – opolskie
09 – podkarpackie
10 – podlaskie
11 – pomorskie
12 – śląskie
13 – świętokrzyskie
14 – warmińsko-mazurskie
15 – wielkopolskie
16 – zachodniopomorskie

Default value :

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Lista nazw świadczeniodawców

Example Value
Model
{
  "meta": {
    "context": "string",
    "count": 0,
    "title": "string",
    "page": 0,
    "url": "string",
    "limit": 0,
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "links": {
    "first": "string",
    "prev": "string",
    "self": "string",
    "next": "string",
    "last": "string"
  },
  "data": [
    "string"
  ]
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
GET
/streets
Zasób zwraca nazwy ulic miejsc udzielania świadczeń zdrowotnych wybranych z bazy danych z nazwami ulic, które zawierają pozycje dostarczane przez podmioty świadczące opiekę zdrowotną. Lista ulic jest wynikiem wyszukiwania według przekazanych parametrów.

Parameters
Name	Description
page
integer($int32)
(query)
Określa aktualnie wyświetlaną stronę.

Default value : 1

limit
integer($int32)
(query)
Określa liczbę pozycji wyświetlanych na stronie (maks. 25)

Default value : 10

format
string
(query)
Określa format odpowiedzi.
json — JavaScript object notation (default)
xml — Extensible markup language

Default value : json

name
string
(query)
Nazwa ulicy miejsca udzielania świadczeń (maks. 250 znaków)

Default value :

province
string
(query)
Kod województwa
Dostępne wartości:
01 – dolnośląskie
02 – kujawsko-pomorskie
03 – lubelskie
04 – lubuskie
05 - łódzkie
06 – małopolskie
07 – mazowieckie
08 – opolskie
09 – podkarpackie
10 – podlaskie
11 – pomorskie
12 – śląskie
13 – świętokrzyskie
14 – warmińsko-mazurskie
15 – wielkopolskie
16 – zachodniopomorskie

Default value :

api-version
string
(query)
The requested API version
Default value : 1.3

Responses
Response content type

text/plain
Code	Description
200	
Lista nazw ulic miejsc udzielania świadczeń

Example Value
Model
{
  "meta": {
    "context": "string",
    "count": 0,
    "title": "string",
    "page": 0,
    "url": "string",
    "limit": 0,
    "provider": "string",
    "date-published": "string",
    "date-modified": "string",
    "description": "string",
    "keywords": "string",
    "language": "string",
    "content-type": "string",
    "is-part-of": "string",
    "message": {
      "type": "string",
      "content": "string"
    }
  },
  "links": {
    "first": "string",
    "prev": "string",
    "self": "string",
    "next": "string",
    "last": "string"
  },
  "data": [
    "string"
  ]
}
400	
Bad Request
Example Value
Model
{
  "errors": [
    {
      "id": "string",
      "error-result": "string",
      "error-reason": "string",
      "error-solution": "string",
      "error-help": "string",
      "error-code": 0
    }
  ]
}
Info

GET
/version
Models
queues-response{
description:	
Odpowiedź na żądanie listy pierwszych wolnych terminów leczenia

meta	metadata{...}
links	links{...}
data	[...]
}
metadata{
description:	
Metadane
Więcej informacji: https://api.nfz.gov.pl/metadata

context	string
Link do kontekstu wyjaśniającego model

count	integer($int32)
Liczba znalezionych pozycji
title	string
page	integer($int32)
Aktualnie przeglądana strona

url	string
limit	integer($int32)
maximum: 25
minimum: 1
Liczba pozycji na stronę

provider	string
date-published	string
date-modified	string
description	string
keywords	string
language	string
content-type	string
is-part-of	string
message	message{...}
}
links{
description:	
Linki nawigujące HATEOS
Więcej informacji: https://api.nfz.gov.pl/metadata/#links

first	string
Link do pierwszej strony ze znalezionymi pozycjami
prev	string
Link do poprzedniej strony ze znalezionymi pozycjami
self	string
Link aktualnej strony ze znalezionymi pozycjami
next	string
Link do następnej strony ze znalezionymi pozycjami

last	string
Link do ostatniej strony ze znalezionymi pozycjami
}
queue{
description:	
Szczegóły pierwszego wolnego terminu leczenia
Schema: https://api.nfz.gov.pl/app-itl-api/schema/queue

type	string
Typ obiektu
id	string($uuid)
Unikalny identyfikator
attributes	queue-attributes{...}
}
message{
type	string
content	string
}
queue-attributes{
description:	
Szczegóły przedstawiające atrybuty pierwszego wolnego terminu leczenia

case	integer($int32)
Kategoria medyczna, do której jest kwalifikowany pacjent na podstawie informacji m.in. o jego stanie zdrowia, chorobach współistniejących,
rokowaniach co do dalszego przebiegu choroby, wykazywana najczęściej na skierowaniu. Przyjmuje wartości: 1 = przypadek stabilny (w innych przypadkach niż stan nagły i przypadek pilny),
2 = przypadek pilny (jeśli istnieje konieczność pilnego udzielenia świadczenia).

benefit	string
Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym, w pracowni diagnostycznej,
w ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących.

anesthesia	string
Znieczulenie wykonywane dla świadczeń z zakresu gastroskopii i kolonoskopii

many-places	string
Znacznik wskazujący, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ. Przyjmuje wartości: N = nie udziela świadczenia
w innych miejscach, Y - udziela świadczenie w innych miejscach

provider	string
Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ

provider-code	string
Kod świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ

regon-provider	string
Numer REGON świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ

nip-provider	string
Numer NIP świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ

teryt-provider	string
Kod TERYT świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ

place	string
Nazwa miejsca udzielania świadczeń w szpitalu/przychodni

address	string
Adres miejsca udzielania świadczeń w szpitalu/przychodni

locality	string
Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni

phone	string
Telefon do miejsca udzielania świadczeń w szpitalu/przychodni

teryt-place	string
Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni

registry-number	string
Numer księgi rejestrowej

id-resort-part-VII	string
VII część kodu resortowego miejsca udzielania świadczeń

id-resort-part-VIII	string
VIII część kodu resortowego miejsca udzielania świadczeń

benefits-for-children	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak

age-range	string
Przedział wiekowy dla świadczeń udzielanych dzieciom w poradniach dla dorosłych

covid-19	string
Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak

toilet	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak

ramp	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak

car-park	string
Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak

elevator	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak

latitude	number($double)
Szerokość geograficzna miejsca udzielania świadczeń

longitude	number($double)
Długość geograficzna miejsca udzielania świadczeń

statistics	statistics{...}
dates	first-available-date{...}
benefits-provided	benefits-provided{...}
}
statistics{
description:	
Informacje statystyczne dotyczące listy oczekujących
Schema: https://api.nfz.gov.pl/app-itl-api/schema/statistics

provider-data	provider-data{...}
computed-data	computed-data{...}
}
first-available-date{
description:	
Daty pierwszego wolnego terminu leczenia
Schema: https://api.nfz.gov.pl/app-itl-api/schema/first-available-date

applicable	boolean
Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin

date	string($date-time)
Data pierwszego wolnego terminu udzielenia świadczenia

date-situation-as-at	string($date-time)
Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia

}
benefits-provided{
description:	
Informacje o ilosci wykonanych świadczeń
Schema: https://api.nfz.gov.pl/app-itl-api/schema/benefits-provided

type-of-benefit	integer($int32)
Typ świdczenia którgo dotyczy ilość wykonanych świadczeń
1 - świadczenia z zakresu endoprotezoplastyki

year	integer($int32)
Rok w którym ilość świadczeń została wykonana

amount	integer($int32)
Ilość wykonanych świadczeń

}
provider-data{
description:	
Informacje statystyczne dostarczone przez świadczeniodawcę
Schema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data

awaiting	integer($int32)
Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące
leczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością

removed	integer($int32)
Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia

average-period	integer($int32)
Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE

update	string
Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca
z listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne

}
computed-data{
description:	
Informacje statystyczne obiczone i dostarczone przez NFZ
Schema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data

average-period	integer($int32)
Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE

update	string
Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca
z listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne

}
errors-response{
errors	[...]
}
error{
id	string($uuid)
error-result	string
error-reason	string
error-solution	string
error-help	string
error-code	integer($int32)
}
many-places-response{
description:	
Odpowiedź na żądanie listy szczegółów dotyczących terminyów leczenia udzielanych przez świadczeniodawcę w innych miejscach w ramach zawartej umowy z NFZ

meta	base-metadata{...}
data	many-places{...}
}
base-metadata{
description:	
Metadane
Więcej informacji: https://api.nfz.gov.pl/metadata

context	string
Link do kontekstu wyjaśniającego model

title	string
url	string
provider	string
date-published	string
date-modified	string
description	string
keywords	string
language	string
content-type	string
is-part-of	string
message	message{...}
}
many-places{
description:	
Szczegóły dotyczące wielu miejsc
Schema: https://api.nfz.gov.pl/app-itl-api/schema/many-places

type	string
Typ obiektu
attributes	many-places-attributes{...}
}
many-places-attributes{
description:	
Szczegóły przestawiające atrybuty znacznika wskazującego, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ

benefit	string
Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym,
w pracowni diagnostycznej, w ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących.

provider	string
Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ

places	[...]
}
many-places-queue{
description:	
Szczegóły listy pierwszych wolnych terminów leczenia w innych miejscach dla wybranego świadczenia udzielanego przez konkretnego świadczeniodawcę
Schema: https://api.nfz.gov.pl/app-itl-api/schema/many-places-queue

id	string($uuid)
Unikalny identyfikator
type	string
attributes	placeAttributes{...}
}
placeAttributes{
place	string
Nazwa miejsca udzielania świadczeń w szpitalu/przychodni

address	string
Adres miejsca udzielania świadczeń w szpitalu/przychodni

locality	string
Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni

phone	string
Telefon do miejsca udzielania świadczeń w szpitalu/przychodni

teryt-place	string
Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni

id-resort-part-VII	string
VII część kodu resortowego miejsca udzielania świadczeń

id-resort-part-VIII	string
VIII część kodu resortowego miejsca udzielania świadczeń

benefits-for-children	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak

age-range	string
Znacznik wskazujący świadczenia wykonywane dla określonych grup wiekowych

anesthesia	string
Znacznik wskazujący, czy jest wykonywane znieczulenie dla dzieci dla świadczeń z zakresu gastroskopii i kolonoskopii

covid-19	string
Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak

toilet	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak

ramp	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak

car-park	string
Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak

elevator	string
Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak

latitude	number($double)
Szerokość geograficzna miejsca udzielania świadczeń

longitude	number($double)
Długość geograficzna miejsca udzielania świadczeń

statistics	statistics{...}
dates	first-available-date{...}
}
places-response{
description:	
Odpowiedź na żadanie nazwy miejsca udzielania świadczeń
Schema: https://api.nfz.gov.pl/app-itl-api/schema/place

meta	metadata{...}
links	links{...}
data	[...]
}
localities-response{
description:	
Odpowiedź na żadanie nazwy miejscowości miejsca udzielania świadczeń
Schema: https://api.nfz.gov.pl/app-itl-api/schema/locality

meta	metadata{...}
links	links{...}
data	[...]
}
benefits-response{
description:	
Odpowiedź na żadanie nazwy świadczenia określonego przez NFZ
Schema: https://api.nfz.gov.pl/app-itl-api/schema/benefit

meta	metadata{...}
links	links{...}
data	[...]
}
providers-response{
description:	
Odpowiedź na żadanie nazwy świadczeniodawcy
Schema: https://api.nfz.gov.pl/app-itl-api/schema/provider

meta	metadata{...}
links	links{...}
data	[...]
}
streets-response{
description:	
Odpowiedź na żadanie nazwy ulicy miejsca udzielania świadczeń
Schema: https://api.nfz.gov.pl/app-itl-api/schema/street

meta	metadata{...}
links	links{...}
data	[...]
}
version-response{
description:	
Szczegóły dotyczące wersji API

api-version	api-version{...}
}
api-version{
description:	
Szczegóły dotyczące wersji api

major	integer($int32)
Numer major wersji
minor	integer($int32)
Numer minor wersji
patch	integer($int32)
Numer patch wersji
date-mod	string
Data modifikacji zasobu
deprecated	boolean
Określa czy dana wersja jest przestarzała

}