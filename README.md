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

## NimbusCMS application

The `plugin/` directory contains the new NimbusCMS-native application layer. It
keeps restaurant-specific data in its own `rest_*` tables and now provides the
following operational verticals:

- Floor tables and live table status
- Dine-in and online order records
- Kitchen queue data
- Reservations
- Simulated payment settlement records and payment status fields
- Revenue, order, and popular-item reports
- A simulated online-order endpoint suitable for a public storefront

The plugin follows NimbusCMS's Composer plugin contract, reads a published
`menu_items` collection through Nimbus's read-only content capability, and uses
capability-gated admin access plus `/ext/restaurant-operations/*` endpoints. It
is designed to be installed into a Nimbus site alongside the CMS:

```bash
cd plugin
composer install
```

Then add the plugin as a Composer path repository in the Nimbus site:

```json
{
  "repositories": [
    { "type": "path", "url": "../restaurant-operations/plugin" }
  ],
  "require": {
    "danf73/restaurant-operations": "*"
  }
}
```

Run Nimbus migrations after installation. The online ordering and payment flows
are intentionally simulated; production use still requires a payment provider,
webhook verification, staff authentication, auditing, and deployment-specific
rate limiting.

## Order lifecycle

`New -> Preparing -> Ready -> Completed`

Orders are held in memory and reset whenever the server restarts. This makes the project easy to explore, while a production deployment would need persistent storage, authentication, input validation, HTTPS, and monitoring.

## Development notes

- Add or edit sample menu data in `server.js`.
- Update station interfaces in `public/`.
- The server exposes REST endpoints for menu and orders and Socket.IO events for live updates.
- Legacy interface experiments are retained in `public/kitchen-old.html` and `public/kitchen-backup.html` for reference.

## Ideas and roadmap

This project is intentionally small enough to run locally, but it has room to grow. The current release includes the first four ideas below:

- [x] Persist an unfinished kiosk cart in the browser so a refresh does not lose an order.
- [x] Validate order items and calculate the total on the server before an order reaches the kitchen.
- [x] Give kiosk customers clear loading, success, and error feedback when an order is submitted.
- [x] Improve kiosk form accessibility with labels, status announcements, and browser autocomplete.
- [ ] Add table and floor management for dine-in service.
- [ ] Add reservations and a simple waitlist.
- [ ] Add a payment-provider boundary so demo orders can later support real payments safely.
- [ ] Replace in-memory storage with a database and add authenticated staff accounts.
- [ ] Add customer order tracking from `new` through `completed`.

The floor, reservation, payment, and online-ordering concepts were informed by reviewing the public feature set of [DanMat/Restaurant-Management-System](https://github.com/DanMat/Restaurant-Management-System). No source code from that project is included here.

## Origin

This project started as a personal product idea and was built iteratively with the help of an LLM. The architecture, requirements, testing, and final decisions remain part of the project author's learning process.

## License

ISC
