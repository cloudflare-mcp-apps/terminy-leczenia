Schematy
Na wzór schema.org w API została wykorzystana metadana @context (dostępna w sekcji meta odpowiedzi na żądanie). Ponieważ specyfika danych prezentowanych w API jest na tyle zawiła, że nie mogliśmy wykorzystać gotowych schematów, przygotowaliśmy własne.

Celem poniższych schematów jest określenie kontekstu zwracanych danych. Przykładem problemu określenia znaczenia zwracanych danych jest rzeczownik kolejka, który bez kontekstu ma kilka znaczeń np. kolejka górska, kolejka wąskotorowa, kolejka do sklepu. Dzięki określeniu schematu w łatwy sposób można określić dokładne znaczenie zwracanych danych.

W tej sekcji dostępne są pliki json schema dla poszczególnych encji danych wraz z opisem. Zgodnie ze strukturą dane zwracane są w sekcji data. Pełna struktura dostępna jest również w formie pliku swagger.json.

            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19

{
    "meta": {
        "@context": "string",
        "count": 0,
        "page": 0,
        "limit": 0
    },
    "links": {
        "first": "string",
        "prev": "string",
        "self": "string",
        "next": "string",
        "last": "string"
    },
    "data": [
        ...
    ]
}
            

        
queue
queue-attributes
statistics
provider-data
computed-data
first-available-date
benefits-provided
many-places
many-places-attributes
many-places-queue
error-response
error
version-response
api-version
benefit
active-substances
queue
Szczegóły pierwszego wolnego terminu leczenia

Struktura queue dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
type	string	Typ obiektu
id	string	Unikalny identyfikator
attributes	queue-attributes	Lista atrybutów dla pierwszego wolnego terminu leczenia
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "Queue",
   "type": "object",
   "description": "Szczegóły pierwszego wolnego terminu leczenia\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/queue",
   "format": "queue",
   "additionalProperties": false,
   "properties": {
      "type": {
         "type": "string",
         "description": "Typ obiektu"
      },
      "id": {
         "type": "string",
         "description": "Unikalny identyfikator",
         "format": "guid"
      },
      "attributes": {
         "description": "Lista atrybutów dla pierwszego wolnego terminu leczenia",
         "oneOf": [
            {
               "$ref": "#/definitions/QueueAttributes"
            }
         ]
      }
   },
   "definitions": {
      "QueueAttributes": {
         "type": "object",
         "description": "Szczegóły przedstawiające atrybuty pierwszego wolnego terminu leczenia",
         "format": "queue-attributes",
         "additionalProperties": false,
         "properties": {
            "case": {
               "type": "integer",
               "description": "Kategoria medyczna, do której jest kwalifikowany pacjent na podstawie informacji m.in. o jego stanie zdrowia, chorobach współistniejących, \nrokowaniach co do dalszego przebiegu choroby, wykazywana najczęściej na skierowaniu. Przyjmuje wartości: 1 = przypadek stabilny (w innych przypadkach niż stan nagły i przypadek pilny),\n2 = przypadek pilny (jeśli istnieje konieczność pilnego  udzielenia świadczenia). ",
               "format": "int32"
            },
            "benefit": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym, w pracowni diagnostycznej, \nw ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących. "
            },
            "anesthesia": {
               "type": "string",
               "description": "Znieczulenie wykonywane dla świadczeń z zakresu gastroskopii i kolonoskopii"
            },
            "many-places": {
               "type": "string",
               "description": "Znacznik wskazujący, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ. Przyjmuje wartości: N = nie udziela świadczenia \nw innych miejscach, Y - udziela świadczenie w innych miejscach "
            },
            "provider": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
            },
            "provider-code": {
               "type": "string",
               "description": "Kod świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
            },
            "regon-provider": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Numer REGON świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
            },
            "nip-provider": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Numer NIP świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
            },
            "teryt-provider": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Kod TERYT świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
            },
            "place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Nazwa miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "address": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Adres miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "locality": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "phone": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Telefon do miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "teryt-place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "registry-number": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Numer księgi rejestrowej"
            },
            "id-resort-part-VII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VII część kodu resortowego miejsca udzielania świadczeń"
            },
            "id-resort-part-VIII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VIII część kodu resortowego miejsca udzielania świadczeń"
            },
            "benefits-for-children": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak"
            },
            "age-range": {
               "type": "string",
               "description": "Przedział wiekowy dla świadczeń udzielanych dzieciom w poradniach dla dorosłych"
            },
            "covid-19": {
               "type": "string",
               "description": "Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak"
            },
            "toilet": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "ramp": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "car-park": {
               "type": "string",
               "description": "Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak"
            },
            "elevator": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak"
            },
            "latitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "Szerokość geograficzna miejsca udzielania świadczeń",
               "format": "decimal"
            },
            "longitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "    Długość geograficzna miejsca udzielania świadczeń\n    ",
               "format": "decimal"
            },
            "statistics": {
               "description": "Informacje statystyczne dotyczące listy oczekujących",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Statistics"
                  }
               ]
            },
            "dates": {
               "description": "Daty pierwszego wolnego terminu leczenia",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Dates"
                  }
               ]
            },
            "benefits-provided": {
               "description": "Szczegóły dot. liczby wykonań świadczeń",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/BenefitsProvided"
                  }
               ]
            }
         }
      },
      "Statistics": {
         "type": "object",
         "description": "Informacje statystyczne dotyczące listy oczekujących\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/statistics",
         "format": "statistics",
         "additionalProperties": false,
         "properties": {
            "provider-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ProviderData"
                  }
               ]
            },
            "computed-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ComputedData"
                  }
               ]
            }
         }
      },
      "ProviderData": {
         "type": "object",
         "description": "Informacje statystyczne dostarczone przez świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data",
         "format": "provider-data",
         "additionalProperties": false,
         "properties": {
            "awaiting": {
               "type": "integer",
               "description": "Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące \nleczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością",
               "format": "int32"
            },
            "removed": {
               "type": "integer",
               "description": "Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia",
               "format": "int32"
            },
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "ComputedData": {
         "type": "object",
         "description": "Informacje statystyczne obiczone i dostarczone przez NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data",
         "format": "computed-data",
         "additionalProperties": false,
         "properties": {
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "Dates": {
         "type": "object",
         "description": "Daty pierwszego wolnego terminu leczenia\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/first-available-date",
         "format": "first-available-date",
         "additionalProperties": false,
         "properties": {
            "applicable": {
               "type": "boolean",
               "description": "Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin"
            },
            "date": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            },
            "date-situation-as-at": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            }
         }
      },
      "BenefitsProvided": {
         "type": "object",
         "description": "Informacje o ilosci wykonanych świadczeń\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/benefits-provided",
         "format": "benefits-provided",
         "additionalProperties": false,
         "properties": {
            "type-of-benefit": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Typ świdczenia którgo dotyczy ilość wykonanych świadczeń\n1 - świadczenia z zakresu endoprotezoplastyki",
               "format": "int32"
            },
            "year": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Rok w którym ilość świadczeń została wykonana",
               "format": "int32"
            },
            "amount": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Ilość wykonanych świadczeń",
               "format": "int32"
            }
         }
      }
   }
}

        
queue-attributes
Szczegóły przedstawiające atrybuty pierwszego wolnego terminu leczenia

Struktura queue-attributes dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
case	integer	Kategoria medyczna, do której jest kwalifikowany pacjent na podstawie informacji m.in. o jego stanie zdrowia, chorobach współistniejących, rokowaniach co do dalszego przebiegu choroby, wykazywana najczęściej na skierowaniu. Przyjmuje wartości: 1 = przypadek stabilny (w innych przypadkach niż stan nagły i przypadek pilny), 2 = przypadek pilny (jeśli istnieje konieczność pilnego udzielenia świadczenia).
benefit	string	Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym, w pracowni diagnostycznej, w ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących.
anesthesia	string	Znieczulenie wykonywane dla świadczeń z zakresu gastroskopii i kolonoskopii
many-places	string	Znacznik wskazujący, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ. Przyjmuje wartości: N = nie udziela świadczenia w innych miejscach, Y - udziela świadczenie w innych miejscach
provider	string	Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ
provider-code	string	Kod świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ
regon-provider	string	Numer REGON świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ
nip-provider	string	Numer NIP świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ
teryt-provider	string	Kod TERYT świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ
place	string	Nazwa miejsca udzielania świadczeń w szpitalu/przychodni
address	string	Adres miejsca udzielania świadczeń w szpitalu/przychodni
locality	string	Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni
phone	string	Telefon do miejsca udzielania świadczeń w szpitalu/przychodni
teryt-place	string	Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni
registry-number	string	Numer księgi rejestrowej
id-resort-part-VII	string	VII część kodu resortowego miejsca udzielania świadczeń
id-resort-part-VIII	string	VIII część kodu resortowego miejsca udzielania świadczeń
benefits-for-children	string	Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak
age-range	string	Przedział wiekowy dla świadczeń udzielanych dzieciom w poradniach dla dorosłych
covid-19	string	Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak
toilet	string	Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak
ramp	string	Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak
car-park	string	Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak
elevator	string	Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak
latitude	number	Szerokość geograficzna miejsca udzielania świadczeń
longitude	number	Długość geograficzna miejsca udzielania świadczeń
statistics	statistics	Informacje statystyczne dotyczące listy oczekujących
dates	first-available-date	Daty pierwszego wolnego terminu leczenia
benefits-provided	benefits-provided	Szczegóły dot. liczby wykonań świadczeń
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "QueueAttributes",
   "type": "object",
   "description": "Szczegóły przedstawiające atrybuty pierwszego wolnego terminu leczenia",
   "format": "queue-attributes",
   "additionalProperties": false,
   "properties": {
      "case": {
         "type": "integer",
         "description": "Kategoria medyczna, do której jest kwalifikowany pacjent na podstawie informacji m.in. o jego stanie zdrowia, chorobach współistniejących, \nrokowaniach co do dalszego przebiegu choroby, wykazywana najczęściej na skierowaniu. Przyjmuje wartości: 1 = przypadek stabilny (w innych przypadkach niż stan nagły i przypadek pilny),\n2 = przypadek pilny (jeśli istnieje konieczność pilnego  udzielenia świadczenia). ",
         "format": "int32"
      },
      "benefit": {
         "type": [
            "null",
            "string"
         ],
         "description": "Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym, w pracowni diagnostycznej, \nw ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących. "
      },
      "anesthesia": {
         "type": "string",
         "description": "Znieczulenie wykonywane dla świadczeń z zakresu gastroskopii i kolonoskopii"
      },
      "many-places": {
         "type": "string",
         "description": "Znacznik wskazujący, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ. Przyjmuje wartości: N = nie udziela świadczenia \nw innych miejscach, Y - udziela świadczenie w innych miejscach "
      },
      "provider": {
         "type": [
            "null",
            "string"
         ],
         "description": "Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
      },
      "provider-code": {
         "type": "string",
         "description": "Kod świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
      },
      "regon-provider": {
         "type": [
            "null",
            "string"
         ],
         "description": "Numer REGON świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
      },
      "nip-provider": {
         "type": [
            "null",
            "string"
         ],
         "description": "Numer NIP świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
      },
      "teryt-provider": {
         "type": [
            "null",
            "string"
         ],
         "description": "Kod TERYT świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
      },
      "place": {
         "type": [
            "null",
            "string"
         ],
         "description": "Nazwa miejsca udzielania świadczeń w szpitalu/przychodni"
      },
      "address": {
         "type": [
            "null",
            "string"
         ],
         "description": "Adres miejsca udzielania świadczeń w szpitalu/przychodni"
      },
      "locality": {
         "type": [
            "null",
            "string"
         ],
         "description": "Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni"
      },
      "phone": {
         "type": [
            "null",
            "string"
         ],
         "description": "Telefon do miejsca udzielania świadczeń w szpitalu/przychodni"
      },
      "teryt-place": {
         "type": [
            "null",
            "string"
         ],
         "description": "Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni"
      },
      "registry-number": {
         "type": [
            "null",
            "string"
         ],
         "description": "Numer księgi rejestrowej"
      },
      "id-resort-part-VII": {
         "type": [
            "null",
            "string"
         ],
         "description": "VII część kodu resortowego miejsca udzielania świadczeń"
      },
      "id-resort-part-VIII": {
         "type": [
            "null",
            "string"
         ],
         "description": "VIII część kodu resortowego miejsca udzielania świadczeń"
      },
      "benefits-for-children": {
         "type": "string",
         "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak"
      },
      "age-range": {
         "type": "string",
         "description": "Przedział wiekowy dla świadczeń udzielanych dzieciom w poradniach dla dorosłych"
      },
      "covid-19": {
         "type": "string",
         "description": "Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak"
      },
      "toilet": {
         "type": "string",
         "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
      },
      "ramp": {
         "type": "string",
         "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
      },
      "car-park": {
         "type": "string",
         "description": "Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak"
      },
      "elevator": {
         "type": "string",
         "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak"
      },
      "latitude": {
         "type": [
            "null",
            "number"
         ],
         "description": "Szerokość geograficzna miejsca udzielania świadczeń",
         "format": "decimal"
      },
      "longitude": {
         "type": [
            "null",
            "number"
         ],
         "description": "    Długość geograficzna miejsca udzielania świadczeń\n    ",
         "format": "decimal"
      },
      "statistics": {
         "description": "Informacje statystyczne dotyczące listy oczekujących",
         "oneOf": [
            {
               "type": "null"
            },
            {
               "$ref": "#/definitions/Statistics"
            }
         ]
      },
      "dates": {
         "description": "Daty pierwszego wolnego terminu leczenia",
         "oneOf": [
            {
               "type": "null"
            },
            {
               "$ref": "#/definitions/Dates"
            }
         ]
      },
      "benefits-provided": {
         "description": "Szczegóły dot. liczby wykonań świadczeń",
         "oneOf": [
            {
               "type": "null"
            },
            {
               "$ref": "#/definitions/BenefitsProvided"
            }
         ]
      }
   },
   "definitions": {
      "Statistics": {
         "type": "object",
         "description": "Informacje statystyczne dotyczące listy oczekujących\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/statistics",
         "format": "statistics",
         "additionalProperties": false,
         "properties": {
            "provider-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ProviderData"
                  }
               ]
            },
            "computed-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ComputedData"
                  }
               ]
            }
         }
      },
      "ProviderData": {
         "type": "object",
         "description": "Informacje statystyczne dostarczone przez świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data",
         "format": "provider-data",
         "additionalProperties": false,
         "properties": {
            "awaiting": {
               "type": "integer",
               "description": "Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące \nleczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością",
               "format": "int32"
            },
            "removed": {
               "type": "integer",
               "description": "Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia",
               "format": "int32"
            },
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "ComputedData": {
         "type": "object",
         "description": "Informacje statystyczne obiczone i dostarczone przez NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data",
         "format": "computed-data",
         "additionalProperties": false,
         "properties": {
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "Dates": {
         "type": "object",
         "description": "Daty pierwszego wolnego terminu leczenia\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/first-available-date",
         "format": "first-available-date",
         "additionalProperties": false,
         "properties": {
            "applicable": {
               "type": "boolean",
               "description": "Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin"
            },
            "date": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            },
            "date-situation-as-at": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            }
         }
      },
      "BenefitsProvided": {
         "type": "object",
         "description": "Informacje o ilosci wykonanych świadczeń\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/benefits-provided",
         "format": "benefits-provided",
         "additionalProperties": false,
         "properties": {
            "type-of-benefit": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Typ świdczenia którgo dotyczy ilość wykonanych świadczeń\n1 - świadczenia z zakresu endoprotezoplastyki",
               "format": "int32"
            },
            "year": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Rok w którym ilość świadczeń została wykonana",
               "format": "int32"
            },
            "amount": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Ilość wykonanych świadczeń",
               "format": "int32"
            }
         }
      }
   }
}

        
statistics
Informacje statystyczne dotyczące listy oczekujących

Struktura statistics dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
provider-data	provider-data	
computed-data	computed-data	
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "Statistics",
   "type": "object",
   "description": "Informacje statystyczne dotyczące listy oczekujących\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/statistics",
   "format": "statistics",
   "additionalProperties": false,
   "properties": {
      "provider-data": {
         "oneOf": [
            {
               "type": "null"
            },
            {
               "$ref": "#/definitions/ProviderData"
            }
         ]
      },
      "computed-data": {
         "oneOf": [
            {
               "type": "null"
            },
            {
               "$ref": "#/definitions/ComputedData"
            }
         ]
      }
   },
   "definitions": {
      "ProviderData": {
         "type": "object",
         "description": "Informacje statystyczne dostarczone przez świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data",
         "format": "provider-data",
         "additionalProperties": false,
         "properties": {
            "awaiting": {
               "type": "integer",
               "description": "Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące \nleczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością",
               "format": "int32"
            },
            "removed": {
               "type": "integer",
               "description": "Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia",
               "format": "int32"
            },
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "ComputedData": {
         "type": "object",
         "description": "Informacje statystyczne obiczone i dostarczone przez NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data",
         "format": "computed-data",
         "additionalProperties": false,
         "properties": {
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      }
   }
}

        
first-available-date
Daty pierwszego wolnego terminu leczenia

Struktura first-available-date dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
applicable	boolean	Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin
date	string	Data pierwszego wolnego terminu udzielenia świadczenia
date-situation-as-at	string	Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "Dates",
   "type": "object",
   "description": "Daty pierwszego wolnego terminu leczenia\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/first-available-date",
   "format": "first-available-date",
   "additionalProperties": false,
   "properties": {
      "applicable": {
         "type": "boolean",
         "description": "Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin"
      },
      "date": {
         "type": [
            "null",
            "string"
         ],
         "description": "Data pierwszego wolnego terminu udzielenia świadczenia",
         "format": "date-time"
      },
      "date-situation-as-at": {
         "type": [
            "null",
            "string"
         ],
         "description": "Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia",
         "format": "date-time"
      }
   }
}

        
benefits-provided
Informacje o ilosci wykonanych świadczeń

Struktura benefits-provided dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
type-of-benefit	integer	Typ świdczenia którgo dotyczy ilość wykonanych świadczeń 1 - świadczenia z zakresu endoprotezoplastyki
year	integer	Rok w którym ilość świadczeń została wykonana
amount	integer	Ilość wykonanych świadczeń
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "BenefitsProvided",
   "type": "object",
   "description": "Informacje o ilosci wykonanych świadczeń\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/benefits-provided",
   "format": "benefits-provided",
   "additionalProperties": false,
   "properties": {
      "type-of-benefit": {
         "type": [
            "integer",
            "null"
         ],
         "description": "Typ świdczenia którgo dotyczy ilość wykonanych świadczeń\n1 - świadczenia z zakresu endoprotezoplastyki",
         "format": "int32"
      },
      "year": {
         "type": [
            "integer",
            "null"
         ],
         "description": "Rok w którym ilość świadczeń została wykonana",
         "format": "int32"
      },
      "amount": {
         "type": [
            "integer",
            "null"
         ],
         "description": "Ilość wykonanych świadczeń",
         "format": "int32"
      }
   }
}

        
provider-data
Informacje statystyczne dostarczone przez świadczeniodawcę

Struktura provider-data dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
awaiting	integer	Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące leczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością
removed	integer	Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia
average-period	integer	Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE
update	string	Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ProviderData",
   "type": "object",
   "description": "Informacje statystyczne dostarczone przez świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data",
   "format": "provider-data",
   "additionalProperties": false,
   "properties": {
      "awaiting": {
         "type": "integer",
         "description": "Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące \nleczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością",
         "format": "int32"
      },
      "removed": {
         "type": "integer",
         "description": "Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia",
         "format": "int32"
      },
      "average-period": {
         "type": [
            "integer",
            "null"
         ],
         "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
         "format": "int32"
      },
      "update": {
         "type": "string",
         "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
      }
   }
}

        
computed-data
Informacje statystyczne obiczone i dostarczone przez NFZ

Struktura computed-data dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
average-period	integer	Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE
update	string	Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ComputedData",
   "type": "object",
   "description": "Informacje statystyczne obiczone i dostarczone przez NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data",
   "format": "computed-data",
   "additionalProperties": false,
   "properties": {
      "average-period": {
         "type": [
            "integer",
            "null"
         ],
         "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
         "format": "int32"
      },
      "update": {
         "type": "string",
         "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
      }
   }
}

        
error

Struktura error dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
id	string	
error-result	string	
error-reason	string	
error-solution	string	
error-help	string	
error-code	integer	
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "Error",
   "type": "object",
   "additionalProperties": false,
   "properties": {
      "id": {
         "type": "string",
         "format": "guid"
      },
      "error-result": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-reason": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-solution": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-help": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-code": {
         "type": "integer",
         "format": "int32"
      }
   }
}

        
many-places
Szczegóły dotyczące wielu miejsc

Struktura many-places dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
type	string	Typ obiektu
attributes	many-places-attributes	Lista atrybutów dla miejsca
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ManyPlaces",
   "type": "object",
   "description": "Szczegóły dotyczące wielu miejsc\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/many-places",
   "additionalProperties": false,
   "properties": {
      "type": {
         "type": "string",
         "description": "Typ obiektu"
      },
      "attributes": {
         "description": "Lista atrybutów dla miejsca",
         "oneOf": [
            {
               "$ref": "#/definitions/ManyPlacesAttributes"
            }
         ]
      }
   },
   "definitions": {
      "ManyPlacesAttributes": {
         "type": "object",
         "description": "Szczegóły przestawiające atrybuty znacznika wskazującego, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ",
         "format": "many-places-attributes",
         "additionalProperties": false,
         "properties": {
            "benefit": {
               "type": "string",
               "description": "Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym, \nw pracowni diagnostycznej, w ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących. "
            },
            "provider": {
               "type": "string",
               "description": "Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
            },
            "places": {
               "type": "array",
               "description": "Lista terminów leczenia dla danego świadczeniodwcy w innych miejscach w ramach zawartej umowy z NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/queue",
               "items": {
                  "$ref": "#/definitions/ManyPlacesQueue"
               }
            }
         }
      },
      "ManyPlacesQueue": {
         "type": "object",
         "description": "Szczegóły listy pierwszych wolnych terminów leczenia w innych miejscach dla wybranego świadczenia udzielanego przez konkretnego świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/many-places-queue",
         "format": "many-places-queue",
         "additionalProperties": false,
         "properties": {
            "id": {
               "type": "string",
               "description": "Unikalny identyfikator",
               "format": "guid"
            },
            "type": {
               "type": "string"
            },
            "attributes": {
               "description": "Atrybuty miejsca udzielania świadczeń",
               "oneOf": [
                  {
                     "$ref": "#/definitions/PlaceAttributes"
                  }
               ]
            }
         }
      },
      "PlaceAttributes": {
         "type": "object",
         "additionalProperties": false,
         "properties": {
            "place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Nazwa miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "address": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Adres miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "locality": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "phone": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Telefon do miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "teryt-place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "id-resort-part-VII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VII część kodu resortowego miejsca udzielania świadczeń"
            },
            "id-resort-part-VIII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VIII część kodu resortowego miejsca udzielania świadczeń"
            },
            "benefits-for-children": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak"
            },
            "age-range": {
               "type": "string",
               "description": "Znacznik wskazujący świadczenia wykonywane dla określonych grup wiekowych"
            },
            "anesthesia": {
               "type": "string",
               "description": "Znacznik wskazujący, czy jest wykonywane znieczulenie dla dzieci dla świadczeń z zakresu gastroskopii i kolonoskopii "
            },
            "covid-19": {
               "type": "string",
               "description": "Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak"
            },
            "toilet": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "ramp": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "car-park": {
               "type": "string",
               "description": "Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak"
            },
            "elevator": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak"
            },
            "latitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "Szerokość geograficzna miejsca udzielania świadczeń",
               "format": "decimal"
            },
            "longitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "Długość geograficzna miejsca udzielania świadczeń",
               "format": "decimal"
            },
            "statistics": {
               "description": "Informacje statystyczne dotyczące listy oczekujących",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Statistics"
                  }
               ]
            },
            "dates": {
               "description": "Daty pierwszego wolnego terminu leczenia",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Dates"
                  }
               ]
            }
         }
      },
      "Statistics": {
         "type": "object",
         "description": "Informacje statystyczne dotyczące listy oczekujących\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/statistics",
         "format": "statistics",
         "additionalProperties": false,
         "properties": {
            "provider-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ProviderData"
                  }
               ]
            },
            "computed-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ComputedData"
                  }
               ]
            }
         }
      },
      "ProviderData": {
         "type": "object",
         "description": "Informacje statystyczne dostarczone przez świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data",
         "format": "provider-data",
         "additionalProperties": false,
         "properties": {
            "awaiting": {
               "type": "integer",
               "description": "Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące \nleczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością",
               "format": "int32"
            },
            "removed": {
               "type": "integer",
               "description": "Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia",
               "format": "int32"
            },
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "ComputedData": {
         "type": "object",
         "description": "Informacje statystyczne obiczone i dostarczone przez NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data",
         "format": "computed-data",
         "additionalProperties": false,
         "properties": {
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "Dates": {
         "type": "object",
         "description": "Daty pierwszego wolnego terminu leczenia\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/first-available-date",
         "format": "first-available-date",
         "additionalProperties": false,
         "properties": {
            "applicable": {
               "type": "boolean",
               "description": "Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin"
            },
            "date": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            },
            "date-situation-as-at": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            }
         }
      }
   }
}

        
many-places-attributes
Szczegóły przestawiające atrybuty znacznika wskazującego, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ

Struktura many-places-attributes dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
benefit	string	Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym, w pracowni diagnostycznej, w ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących.
provider	string	Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ
places	array [many-places-queue]	Lista terminów leczenia dla danego świadczeniodwcy w innych miejscach w ramach zawartej umowy z NFZ Schema: https://api.nfz.gov.pl/app-itl-api/schema/queue
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ManyPlacesAttributes",
   "type": "object",
   "description": "Szczegóły przestawiające atrybuty znacznika wskazującego, czy świadczeniodawca udziela dane świadczenie zdrowotne w innych miejscach w ramach zawartej umowy z NFZ",
   "format": "many-places-attributes",
   "additionalProperties": false,
   "properties": {
      "benefit": {
         "type": "string",
         "description": "Nazwa świadczenia zdrowotnego (procedury medycznej, programu lekowego, świadczenia w poradni specjalistycznej, w oddziale szpitalnym, \nw pracowni diagnostycznej, w ośrodku opieki pozaszpitalnej), dla którego dany świadczeniodawca prowadzi listę oczekujących. "
      },
      "provider": {
         "type": "string",
         "description": "Nazwa świadczeniodawcy, który udziela dane świadczenie w ramach zawartej umowy z NFZ "
      },
      "places": {
         "type": "array",
         "description": "Lista terminów leczenia dla danego świadczeniodwcy w innych miejscach w ramach zawartej umowy z NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/queue",
         "items": {
            "$ref": "#/definitions/ManyPlacesQueue"
         }
      }
   },
   "definitions": {
      "ManyPlacesQueue": {
         "type": "object",
         "description": "Szczegóły listy pierwszych wolnych terminów leczenia w innych miejscach dla wybranego świadczenia udzielanego przez konkretnego świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/many-places-queue",
         "format": "many-places-queue",
         "additionalProperties": false,
         "properties": {
            "id": {
               "type": "string",
               "description": "Unikalny identyfikator",
               "format": "guid"
            },
            "type": {
               "type": "string"
            },
            "attributes": {
               "description": "Atrybuty miejsca udzielania świadczeń",
               "oneOf": [
                  {
                     "$ref": "#/definitions/PlaceAttributes"
                  }
               ]
            }
         }
      },
      "PlaceAttributes": {
         "type": "object",
         "additionalProperties": false,
         "properties": {
            "place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Nazwa miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "address": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Adres miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "locality": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "phone": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Telefon do miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "teryt-place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "id-resort-part-VII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VII część kodu resortowego miejsca udzielania świadczeń"
            },
            "id-resort-part-VIII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VIII część kodu resortowego miejsca udzielania świadczeń"
            },
            "benefits-for-children": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak"
            },
            "age-range": {
               "type": "string",
               "description": "Znacznik wskazujący świadczenia wykonywane dla określonych grup wiekowych"
            },
            "anesthesia": {
               "type": "string",
               "description": "Znacznik wskazujący, czy jest wykonywane znieczulenie dla dzieci dla świadczeń z zakresu gastroskopii i kolonoskopii "
            },
            "covid-19": {
               "type": "string",
               "description": "Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak"
            },
            "toilet": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "ramp": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "car-park": {
               "type": "string",
               "description": "Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak"
            },
            "elevator": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak"
            },
            "latitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "Szerokość geograficzna miejsca udzielania świadczeń",
               "format": "decimal"
            },
            "longitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "Długość geograficzna miejsca udzielania świadczeń",
               "format": "decimal"
            },
            "statistics": {
               "description": "Informacje statystyczne dotyczące listy oczekujących",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Statistics"
                  }
               ]
            },
            "dates": {
               "description": "Daty pierwszego wolnego terminu leczenia",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Dates"
                  }
               ]
            }
         }
      },
      "Statistics": {
         "type": "object",
         "description": "Informacje statystyczne dotyczące listy oczekujących\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/statistics",
         "format": "statistics",
         "additionalProperties": false,
         "properties": {
            "provider-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ProviderData"
                  }
               ]
            },
            "computed-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ComputedData"
                  }
               ]
            }
         }
      },
      "ProviderData": {
         "type": "object",
         "description": "Informacje statystyczne dostarczone przez świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data",
         "format": "provider-data",
         "additionalProperties": false,
         "properties": {
            "awaiting": {
               "type": "integer",
               "description": "Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące \nleczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością",
               "format": "int32"
            },
            "removed": {
               "type": "integer",
               "description": "Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia",
               "format": "int32"
            },
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "ComputedData": {
         "type": "object",
         "description": "Informacje statystyczne obiczone i dostarczone przez NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data",
         "format": "computed-data",
         "additionalProperties": false,
         "properties": {
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "Dates": {
         "type": "object",
         "description": "Daty pierwszego wolnego terminu leczenia\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/first-available-date",
         "format": "first-available-date",
         "additionalProperties": false,
         "properties": {
            "applicable": {
               "type": "boolean",
               "description": "Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin"
            },
            "date": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            },
            "date-situation-as-at": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            }
         }
      }
   }
}

        
many-places-queue
Szczegóły listy pierwszych wolnych terminów leczenia w innych miejscach dla wybranego świadczenia udzielanego przez konkretnego świadczeniodawcę

Struktura many-places-queue dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
id	string	Unikalny identyfikator
type	string	
attributes	placeAttributes	Atrybuty miejsca udzielania świadczeń
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ManyPlacesQueue",
   "type": "object",
   "description": "Szczegóły listy pierwszych wolnych terminów leczenia w innych miejscach dla wybranego świadczenia udzielanego przez konkretnego świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/many-places-queue",
   "format": "many-places-queue",
   "additionalProperties": false,
   "properties": {
      "id": {
         "type": "string",
         "description": "Unikalny identyfikator",
         "format": "guid"
      },
      "type": {
         "type": "string"
      },
      "attributes": {
         "description": "Atrybuty miejsca udzielania świadczeń",
         "oneOf": [
            {
               "$ref": "#/definitions/PlaceAttributes"
            }
         ]
      }
   },
   "definitions": {
      "PlaceAttributes": {
         "type": "object",
         "additionalProperties": false,
         "properties": {
            "place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Nazwa miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "address": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Adres miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "locality": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Miejscowość miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "phone": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Telefon do miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "teryt-place": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Kod TERYT miejsca udzielania świadczeń w szpitalu/przychodni"
            },
            "id-resort-part-VII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VII część kodu resortowego miejsca udzielania świadczeń"
            },
            "id-resort-part-VIII": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "VIII część kodu resortowego miejsca udzielania świadczeń"
            },
            "benefits-for-children": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń udzielane są świadczenia dla dzieci. Przyjmuje wartości: N = nie, Y = tak"
            },
            "age-range": {
               "type": "string",
               "description": "Znacznik wskazujący świadczenia wykonywane dla określonych grup wiekowych"
            },
            "anesthesia": {
               "type": "string",
               "description": "Znacznik wskazujący, czy jest wykonywane znieczulenie dla dzieci dla świadczeń z zakresu gastroskopii i kolonoskopii "
            },
            "covid-19": {
               "type": "string",
               "description": "Znacznik wskazujący, czy świadczeniodawca zwolniony jest ze sprawozdawczości z powodu prowadzonia leczenia na COVID-19 w mjescu udzielania świadczeń. Przyjmuje wartości: N = nie, Y = tak"
            },
            "toilet": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się łazienka dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "ramp": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się podjazd dla niepełnosprawnych. Przyjmuje wartości: N = nie, Y = tak"
            },
            "car-park": {
               "type": "string",
               "description": "Znacznik wskazujący, czy przy miejscu udzielania świadczeń znajduje się parking. Przyjmuje wartości: N = nie, Y = tak"
            },
            "elevator": {
               "type": "string",
               "description": "Znacznik wskazujący, czy w miejscu udzielania świadczeń znajduje się winda. Przyjmuje wartości: N = nie, Y = tak"
            },
            "latitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "Szerokość geograficzna miejsca udzielania świadczeń",
               "format": "decimal"
            },
            "longitude": {
               "type": [
                  "null",
                  "number"
               ],
               "description": "Długość geograficzna miejsca udzielania świadczeń",
               "format": "decimal"
            },
            "statistics": {
               "description": "Informacje statystyczne dotyczące listy oczekujących",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Statistics"
                  }
               ]
            },
            "dates": {
               "description": "Daty pierwszego wolnego terminu leczenia",
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/Dates"
                  }
               ]
            }
         }
      },
      "Statistics": {
         "type": "object",
         "description": "Informacje statystyczne dotyczące listy oczekujących\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/statistics",
         "format": "statistics",
         "additionalProperties": false,
         "properties": {
            "provider-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ProviderData"
                  }
               ]
            },
            "computed-data": {
               "oneOf": [
                  {
                     "type": "null"
                  },
                  {
                     "$ref": "#/definitions/ComputedData"
                  }
               ]
            }
         }
      },
      "ProviderData": {
         "type": "object",
         "description": "Informacje statystyczne dostarczone przez świadczeniodawcę\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/provider-data",
         "format": "provider-data",
         "additionalProperties": false,
         "properties": {
            "awaiting": {
               "type": "integer",
               "description": "Liczba osób wpisanych na listę oczekujących na świadczenie zdrowotne wg stanu na koniec miesiąca. W liczbie tej nie uwzględniane są osoby kontynuujące \nleczenie oraz osoby z uprawnieniami do korzystania ze świadczeń poza kolejnością",
               "format": "int32"
            },
            "removed": {
               "type": "integer",
               "description": "Liczba osób skreślonych w ciągu miesiąca z listy oczekujących z powodu udzielenia świadczenia",
               "format": "int32"
            },
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "ComputedData": {
         "type": "object",
         "description": "Informacje statystyczne obiczone i dostarczone przez NFZ\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/computed-data",
         "format": "computed-data",
         "additionalProperties": false,
         "properties": {
            "average-period": {
               "type": [
                  "integer",
                  "null"
               ],
               "description": "Średnia liczba dni oczekiwania na świadczenie zdrowotne. NULLABLE",
               "format": "int32"
            },
            "update": {
               "type": "string",
               "description": "Miesiąc aktualizacji danych dotyczących liczby osób wpisanych na listę oczekujących na świadczenie zdrowotne, liczby osób skreślonych w ciągu miesiąca \nz listy oczekujących z powodu udzielenia świadczenia oraz średniej liczby dni oczekiwania na świadczenie zdrowotne"
            }
         }
      },
      "Dates": {
         "type": "object",
         "description": "Daty pierwszego wolnego terminu leczenia\nSchema: https://api.nfz.gov.pl/app-itl-api/schema/first-available-date",
         "format": "first-available-date",
         "additionalProperties": false,
         "properties": {
            "applicable": {
               "type": "boolean",
               "description": "Wyróżnik określający czy dla świadczenia występuje pierwszy wolny termin"
            },
            "date": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            },
            "date-situation-as-at": {
               "type": [
                  "null",
                  "string"
               ],
               "description": "Data aktualizacji pierwszego wolnego terminu udzielenia świadczenia",
               "format": "date-time"
            }
         }
      }
   }
}

        
version-response
Szczegóły dotyczące wersji API

Struktura version-response dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
api-version	api-version	Określa numer wersji API
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "VersionResponse",
   "type": "object",
   "description": "Szczegóły dotyczące wersji API",
   "additionalProperties": false,
   "properties": {
      "api-version": {
         "description": "Określa numer wersji API",
         "oneOf": [
            {
               "$ref": "#/definitions/ApiVersion"
            }
         ]
      }
   },
   "definitions": {
      "ApiVersion": {
         "type": "object",
         "description": "Szczegóły dotyczące wersji api",
         "format": "api-version",
         "additionalProperties": false,
         "properties": {
            "major": {
               "type": "integer",
               "description": "Numer major wersji",
               "format": "int32"
            },
            "minor": {
               "type": "integer",
               "description": "Numer minor wersji",
               "format": "int32"
            },
            "patch": {
               "type": "integer",
               "description": "Numer patch wersji",
               "format": "int32"
            },
            "date-mod": {
               "type": "string",
               "description": "Data modifikacji zasobu"
            },
            "deprecated": {
               "type": "boolean",
               "description": "Określa czy dana wersja jest przestarzała"
            }
         }
      }
   }
}

        
api-version
Szczegóły dotyczące wersji api

Struktura api-version dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
major	integer	Numer major wersji
minor	integer	Numer minor wersji
patch	integer	Numer patch wersji
date-mod	string	Data modifikacji zasobu
deprecated	boolean	Określa czy dana wersja jest przestarzała
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ApiVersion",
   "type": "object",
   "description": "Szczegóły dotyczące wersji api",
   "format": "api-version",
   "additionalProperties": false,
   "properties": {
      "major": {
         "type": "integer",
         "description": "Numer major wersji",
         "format": "int32"
      },
      "minor": {
         "type": "integer",
         "description": "Numer minor wersji",
         "format": "int32"
      },
      "patch": {
         "type": "integer",
         "description": "Numer patch wersji",
         "format": "int32"
      },
      "date-mod": {
         "type": "string",
         "description": "Data modifikacji zasobu"
      },
      "deprecated": {
         "type": "boolean",
         "description": "Określa czy dana wersja jest przestarzała"
      }
   }
}

        
error-response
Struktura zawierająca listę błędów, które wystąpiły w opowiedzi na zapytanie HTTP.

Struktura error-response dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
errors	array,null	
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ErrorResponse",
   "type": "object",
   "additionalProperties": false,
   "properties": {
      "errors": {
         "type": [
            "array",
            "null"
         ],
         "items": {
            "$ref": "#/definitions/Error"
         }
      }
   },
   "definitions": {
      "Error": {
         "type": "object",
         "additionalProperties": false,
         "properties": {
            "id": {
               "type": "string",
               "format": "guid"
            },
            "error-result": {
               "type": [
                  "null",
                  "string"
               ]
            },
            "error-reason": {
               "type": [
                  "null",
                  "string"
               ]
            },
            "error-solution": {
               "type": [
                  "null",
                  "string"
               ]
            },
            "error-help": {
               "type": [
                  "null",
                  "string"
               ]
            },
            "error-code": {
               "type": "integer",
               "format": "int32"
            }
         }
      }
   }
}

        
error
Opis błędu, który wystąpił w odpowiedzi na zapytanie HTTP.

Struktura error dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
id	string	
error-result	null,string	
error-reason	null,string	
error-solution	null,string	
error-help	null,string	
error-code	integer	
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "Error",
   "type": "object",
   "additionalProperties": false,
   "properties": {
      "id": {
         "type": "string",
         "format": "guid"
      },
      "error-result": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-reason": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-solution": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-help": {
         "type": [
            "null",
            "string"
         ]
      },
      "error-code": {
         "type": "integer",
         "format": "int32"
      }
   }
}

        
version-response
Szczegółowy opis wersji API.

Struktura version-response dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
api-version		Określa numer wersji API
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "VersionResponse",
   "type": "object",
   "description": "Szczegóły dotyczące wersji API",
   "additionalProperties": false,
   "properties": {
      "api-version": {
         "description": "Określa numer wersji API",
         "oneOf": [
            {
               "$ref": "#/definitions/ApiVersion"
            }
         ]
      }
   },
   "definitions": {
      "ApiVersion": {
         "type": "object",
         "description": "Szczegóły dotyczące wersji api",
         "format": "api-version",
         "additionalProperties": false,
         "properties": {
            "major": {
               "type": "integer",
               "description": "Numer major wersji",
               "format": "int32"
            },
            "minor": {
               "type": "integer",
               "description": "Numer minor wersji",
               "format": "int32"
            },
            "patch": {
               "type": "integer",
               "description": "Numer patch wersji",
               "format": "int32"
            },
            "date-mod": {
               "type": "string",
               "description": "Data modifikacji zasobu"
            },
            "deprecated": {
               "type": "boolean",
               "description": "Określa czy dana wersja jest przestarzała"
            }
         }
      }
   }
}

        
api-version
Wersja API

Struktura api-version dostępna jest także w SwaggerUI oraz w pliku json schema.

Właściwość	Typ	Opis
major	integer	Numer major wersji
minor	integer	Numer minor wersji
patch	integer	Numer patch wersji
date-mod	string	Data modifikacji zasobu
deprecated	boolean	Określa czy dana wersja jest przestarzała
            
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
{
   "$schema": "http://json-schema.org/draft-04/schema#",
   "title": "ApiVersion",
   "type": "object",
   "description": "Szczegóły dotyczące wersji api",
   "format": "api-version",
   "additionalProperties": false,
   "properties": {
      "major": {
         "type": "integer",
         "description": "Numer major wersji",
         "format": "int32"
      },
      "minor": {
         "type": "integer",
         "description": "Numer minor wersji",
         "format": "int32"
      },
      "patch": {
         "type": "integer",
         "description": "Numer patch wersji",
         "format": "int32"
      },
      "date-mod": {
         "type": "string",
         "description": "Data modifikacji zasobu"
      },
      "deprecated": {
         "type": "boolean",
         "description": "Określa czy dana wersja jest przestarzała"
      }
   }
}

        
benefit
Uwaga! benefit jest to model słownikowy. Zwracany jest w postaci ciągu znaków (String) w sekcji data.

locality
Uwaga! locality jest to model słownikowy. Zwracany jest w postaci ciągu znaków (String) w sekcji data.

place
Uwaga! place jest to model słownikowy. Zwracany jest w postaci ciągu znaków (String) w sekcji data.

provider
Uwaga! provider jest to model słownikowy. Zwracany jest w postaci ciągu znaków (String) w sekcji data.

street
Uwaga! street jest to model słownikowy. Zwracany jest w postaci ciągu znaków (String) w sekcji data.