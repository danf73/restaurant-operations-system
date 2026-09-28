# Restaurant Operations for NimbusCMS

This directory is a NimbusCMS plugin implementation of the restaurant
operations domain. It owns its operational tables under the `rest_*` namespace
and does not modify Nimbus core.

## Current verticals

- Floor tables and table status
- Published Nimbus menu reading through `ContentReader`
- Server-priced online orders with line-item snapshots
- Kitchen queue and order lifecycle data
- Reservations and reservation status
- Simulated payment settlement records
- Reports for revenue, orders, and popular items

The payment flow is deliberately simulated. Do not connect it to real payment
credentials without adding a provider adapter, webhook signature verification,
idempotency, audit logging, and staff authentication.

## Install into a Nimbus site

Add this directory as a Composer path repository in the Nimbus site:

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

Then run the normal Nimbus install and migration commands. Create a published
`menu_items` collection with a `price` field and optional `category` field. The
plugin reads that collection in-process and snapshots the name and price into
each order so later menu edits cannot rewrite historical bills.

Public routes are mounted by Nimbus under `/ext/restaurant-operations/`.

Staff-facing JSON routes require a bearer token matching the
`RESTAURANT_OPERATOR_TOKEN` environment variable. The public menu, online order,
and reservation-booking routes do not require that operator token.
