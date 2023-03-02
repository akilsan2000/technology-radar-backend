# technology-radar-backend

Dies ist das Backend vom Projekt Technologie Radar. Es wurde mit Node.js umgesetzt.
Nachdem das Repository geclont wurde, können mit dem Befehl `npm install` die benötigten Packages installiert werden.

Es muss lokal eine MongoDB Datenbank laufen.

Es ist wichtig dass die Frontend Applikation auf dem Port 4200 läuft, damit es keine CORS-Fehler gibt.

Es muss eine Datei mit dem Namen ".env" erstellt werden (in welchem sich auch der Connection-String von MongoDB befinden) mit folgenem Inhalt:
```
TOKEN_KEY="TEST123"
ConnectionStringDB="mongodb://localhost:27017"
```

Mit dem Befehl `node app.js` kann der Server gestartet werden.
