J(avascript Ch)ess Client
=========================

A simple experiment to write an javascript browser based realtime multiplayer chess game

Requires a websocket channel echo server

Run
---

### Local Dev (multiple servers in terminals)

```bash
    make run_local_server
    python3 -m webbrowser -t "http://localhost:9800/"
    make run_local
    python3 -m webbrowser -t "http://localhost:8080/"
```

### Production

```bash
    make run_production
```

Features
--------

* Just code (no images)
    * Uses unicode chess glyphs
* State is kept in single serialized json object
* Auto-join a unique channel
* Inbuilt chat client
* Restores state from other clients (if needed)


Other Ideas like this
---------------------

http://www.mattkeeter.com/projects/pont/

