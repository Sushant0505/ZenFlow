# Zenflo Fleet Ops

A small web app for the Zenflo operations team to track electric loader vehicles, driver assignments, weekly rent and breakdowns.
Built with **React (Vite)**, **Node.js + Express**, and **MongoDB (Mongoose)**. Porter integration is out of scope; the app ships with sample data.

## Features

| Area | What you can do |
| --- | --- |
| Dashboard | Total, available, assigned and under-maintenance vehicles, a fleet composition bar, and outstanding rent per driver |
| Fleet & drivers | Add and view vehicles and drivers, assign a vehicle to a driver, return a vehicle |
| Rentals | Record weekly rent (Paid or Pending), mark pending rent as paid, see outstanding totals, filter history |
| Breakdowns | Log a breakdown (date, issue), set the vehicle to Under Maintenance or Available, mark repaired vehicles Available |

## Setup

**Prerequisites:** Node.js 18+ and a running MongoDB (local, or an Atlas connection string).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # edit MONGODB_URI if needed
npm run seed                # loads sample data (safe to re-run, it resets the data)
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

Run the unit tests with `cd server && npm test`.

## Deploy to Render

The `render.yaml` Blueprint builds the React client and serves it with the Express API as one web service. The build explicitly installs the client's development dependencies because Vite is required to create the production bundle. The app uses MongoDB Atlas for its production database.

1. Push this project to a GitHub repository.
2. Create a MongoDB Atlas cluster and a database user with a strong password. Add `0.0.0.0/0` under Atlas **Network Access** so Render can connect; restrict database permissions to the Zenflo database.
3. Copy the Atlas connection string for the database user.
4. In Render, choose **New + → Blueprint**, connect the GitHub repository, and deploy the detected `render.yaml`.
5. When prompted for `MONGODB_URI`, paste the Atlas connection string. Replace the placeholder database name with `zenflo` if needed.
6. Open the deployed Render URL. The deployment health check is available at `/api/health`.

Render's free web service may sleep after inactivity and take a short time to wake. Never commit `.env` files or paste database credentials into source files.

## Data model

```
Vehicle      registrationNumber (unique), model, batteryCapacityKwh, status [Available | Assigned | Under Maintenance]
Driver       name, phone (unique), licenseNumber (unique), active
Assignment   vehicle -> Vehicle, driver -> Driver, startDate, endDate, isActive
Rental       driver -> Driver, vehicle -> Vehicle, weekStart (Monday), amount, status [Paid | Pending], paidOn
Breakdown    vehicle -> Vehicle, driver -> Driver, date, issue, vehicleStatusAfter, status [Open | Resolved], resolvedAt
```

Relationships: a Driver has many Assignments and Rentals; a Vehicle has many Assignments and Breakdowns.

### Key design decisions

- **Assignments are their own collection.** Rather than storing `driverId` on the vehicle, each pairing is a document with an `isActive` flag. This keeps history and lets MongoDB enforce the rule.
- **"One active driver per vehicle" is enforced at three levels.** (1) The API checks first and returns a clear message. (2) The vehicle is claimed with an atomic `findOneAndUpdate({ status: 'Available' })`, so two simultaneous requests cannot both succeed. (3) Partial unique indexes on `Assignment` (`{ vehicle }` and `{ driver }` where `isActive: true`) are the final guarantee. A driver also cannot hold two vehicles.
- **Vehicle status is stored, not computed.** It is updated by the assignment and breakdown flows, so the dashboard counts with one aggregation.
- **Rentals are keyed to the Monday of the week**, with a unique `(driver, weekStart)` index, so the same driver cannot be billed twice for a week. Outstanding rent is the sum of `Pending` rentals, grouped by driver.
- **Logging a breakdown as Under Maintenance ends the active assignment**, so the driver can be given another vehicle. Marking the breakdown repaired makes the vehicle Available. Choosing Available when logging means a minor issue fixed on the spot; the vehicle keeps its driver.
- **Consistent errors.** Every failure returns `{ message }` with a sensible status: 400 validation, 404 not found, 409 business-rule conflict.

## REST API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard` | Fleet counts, outstanding rent, open breakdowns |
| GET / POST | `/api/vehicles` | List (with current driver) / add vehicle |
| GET / POST | `/api/drivers` | List (with current vehicle) / add driver |
| POST | `/api/assignments` | Assign `{ vehicleId, driverId }` |
| POST | `/api/assignments/:id/end` | Return the vehicle |
| GET / POST | `/api/rentals` | List (`?status=Pending`) / record weekly rent |
| PATCH | `/api/rentals/:id/pay` | Mark a rental paid |
| GET | `/api/rentals/outstanding` | Total and per-driver outstanding rent |
| GET / POST | `/api/breakdowns` | List / log breakdown `{ vehicleId, date, issue, vehicleStatus }` |
| PATCH | `/api/breakdowns/:id/resolve` | Mark repaired, vehicle becomes Available |

## Manual test checklist

1. Seed, open the dashboard: 10 vehicles, 5 assigned, 2 under maintenance, 3 available.
2. Fleet: assign an available vehicle to a free driver. The counts change on the dashboard.
3. Try assigning the same driver a second vehicle: error "already has vehicle ...".
4. Fire two assign requests for one vehicle at once (curl in two terminals): one succeeds, one returns 409.
5. Add a vehicle with a duplicate registration: 409 with a clear message. Add a driver with a bad phone number: 400.
6. Rentals: record rent for a driver and week that already exists: 409. Mark a pending rental paid: outstanding drops.
7. Breakdowns: log one as Under Maintenance on an assigned vehicle: the vehicle leaves its driver. Mark it available: it returns to the pool.

## Project structure

```
server/src  models/ controllers/ routes/ middleware/ utils/  app.js  index.js  seed.js
client/src  pages/ components/  api.js  hooks.js  App.jsx  styles.css
```

## Possible next steps (out of scope here)

Authentication, editing and deleting records, a per-vehicle history page, automated API tests, and Porter trip data.
