# RepairX Demo Setup

This document covers the development-only demo environment used to exercise the stakeholder workflow repeatedly without affecting production or the regular local development database.

## Environment guardrails

- The demo database is isolated to `repairx_demo`.
- Demo reset must not run in production.
- Demo-only credentials are documented here for local development only.
- No production credentials or secrets are committed to source control.

## Prerequisites

1. Start MongoDB locally.
2. Ensure you are working in a development or test environment.
3. Keep the demo password in local environment variables only, not in production config.

## MongoDB start

For a local MongoDB instance:

```bash
mongod --dbpath /tmp/repairx-demo-db
```

If MongoDB is installed via Homebrew:

```bash
brew services start mongodb-community
```

## Demo reset

Run:

```bash
npm run demo:reset
```

This command:

- validates the environment is not production
- uses the dedicated MongoDB database `repairx_demo`
- clears only the demo database
- recreates the deterministic demo user, workshop, technician, device, and repair records
- is idempotent and safe to run repeatedly

## Import Full Catalog CSV

Save the supplied CSV as `data/device-catalog.csv`, then import it into the regular working-prototype database:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/repairx \
APP_ENV=development \
npm run catalog:import -- data/device-catalog.csv
```

To import the same catalog into the isolated demo database, use `repairx_demo` as the database name. The importer deduplicates repeated colour, price, and storage rows into one model entry, so the Company and Model dropdowns stay clean while model details remain available.

## Start app using demo database

Run:

```bash
npm run dev:demo
```

Do not start the demo with a `MONGODB_URI` ending in `/repairx`; that is the regular local database and does not contain the isolated demo catalog records.

## Demo accounts

Use the normal login screen only. Do not inject sessions manually.

- Customer: customer@repairx.local / RepairX@12345
- Workshop owner: workshop@repairx.local / RepairX@12345
- Technician: technician@repairx.local / RepairX@12345
- Admin: admin@repairx.local / RepairX@12345

## Demo workflow

1. Customer logs in.
2. Customer sees Device A and Device B on the customer dashboard.
3. Customer opens Device A and sees previous repair history.
4. Customer raises the demo repair case.
5. Workshop owner logs in and sees the same repair case.
6. Technician logs in and sees the assigned case.
7. Technician verifies the diagnosis or repair action.
8. Customer logs in again and sees the updated case state.
9. Admin logs in and views the same case in operations.

## Notes

- The same repair case remains consistent across all stakeholder views.
- Device B remains separate and unrelated.
- No fake metrics are introduced; the dashboard should reflect actual data in the demo database.
