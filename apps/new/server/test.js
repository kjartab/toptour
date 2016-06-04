var str = {"url":"http://www.ut.no/tur/56d15fe2e74c930100291a30","tilkomst":{"generell":"Rv76 til parkeringsplass på østsiden av Tosentunellen, posisjon 33 W 414344 7244250 eller N65° 18\' 35.9\" E13° 09' 43.4\". 85 km fra Brønnøysund, 76 km fra Mosjøen."},"tilbyder":"DNT","lisens":"CC BY-SA 4.0"};

console.log(JSON.stringify(str).replace(/'/g, "\'\'").replace('\\\'', '\'\''));

