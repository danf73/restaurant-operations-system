# Restaurant Operations System

A small, real-time restaurant operations platform built from an initial idea and developed with LLM assistance. It brings customer ordering, kitchen coordination, order assembly, and manager reporting into one approachable demo application.

## What it includes

- **Customer kiosk** for touch-friendly ordering and cart management
- **Kitchen display** with live order queues, preparation timers, priorities, and audio alerts
- **Assembly station** for completing ready orders and tracking throughput
- **Manager dashboard** with order, revenue, promotion, feedback, and loyalty views
- **Desktop launcher** powered by Electron for opening each station in its own window
- **Live synchronization** across browser windows using Socket.IO

## Technology

- Node.js and Express
- Socket.IO
- Electron
- Vanilla HTML, CSS, and JavaScript
- In-memory data storage for quick demos

## Getting started

Requirements: Node.js 18 or newer and npm.

```bash
npm install
npm run server
```

Open `http://localhost:3001` in a browser. The server port can be changed with the `PORT` environment variable.

To launch the desktop application instead:

```bash
npm start
```

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Operations dashboard |
| `/kiosk` | Customer ordering |
| `/kitchen` | Kitchen display |
| `/assembly` | Order assembly |
| `/manager` | Manager dashboard |

## Order lifecycle

`New -> Preparing -> Ready -> Completed`

Orders are held in memory and reset whenever the server restarts. This makes the project easy to explore, while a production deployment would need persistent storage, authentication, input validation, HTTPS, and monitoring.

## Development notes

- Add or edit sample menu data in `server.js`.
- Update station interfaces in `public/`.
- The server exposes REST endpoints for menu and orders and Socket.IO events for live updates.
- Legacy interface experiments are retained in `public/kitchen-old.html` and `public/kitchen-backup.html` for reference.

## Origin

This project started as a personal product idea and was built iteratively with the help of an LLM. The architecture, requirements, testing, and final decisions remain part of the project author's learning process.

## License

ISC
