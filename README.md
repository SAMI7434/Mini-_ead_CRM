# Lead Management API

A RESTful API for managing leads with status tracking, built with Express.js and TypeScript. Features Redis caching, bulk operations, and strict status transition validation.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start server (development)
npm run dev

# Or start directly from TS
npx ts-node src/app2.ts

# Run tests
node test.js
```

Server runs at `http://localhost:3000`

---

## 📊 Code Structure

![image alt](https://github.com/SAMI7434/Mini-_ead_CRM/blob/master/arc.png)

 for fullscreen.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js + Express
- **Language:** TypeScript
- **Cache:** Redis (optional, falls back to in-memory Map)
- **Storage:** In-memory Map (replaceable with DB)

---

## 📁 Project Structure

```
.
├── src/
│   └── app2.ts        # Main application (routes, validation, cache)
├── dist/
│   └── app2.js        # Compiled output
├── test.js            # Integration tests (20 scenarios)
├── seed.js            # Database seeder
└── package.json
```

---

## 🔄 Status Flow

```
NEW → CONTACTED → QUALIFIED → CONVERTED
    ↘             ↘          ↘
    LOST          LOST          LOST
```

- `CONVERTED` and `LOST` are terminal states — no further transitions allowed
- Only forward progression (except `LOST` can be reached from any point)
- Status changes **must** use `PATCH /leads/:id/status` endpoint

---

## 🧪 Test Coverage

Run `node test.js` to execute 20 test scenarios covering:

- Single/bulk create, update, delete
- Status transition validation (valid + invalid paths)
- Cache hit/miss behavior
- Input validation (email format, required fields)
- Error handling (404, 400, 500)

All tests pass ✅

---

## 🎯 Features

- ✅ CRUD operations on leads
- ✅ Bulk create & bulk update (array payloads)
- ✅ Redis caching with automatic fallback to Map
- ✅ Email validation (regex)
- ✅ Status transition enforcement
- ✅ Optional status filter on list endpoint
- ✅ Comprehensive error handling

---

## 📖 API Reference

### Create Lead
```http
POST /leads
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "source": "website"
}
```

### List Leads
```http
GET /leads                    # All
GET /leads?status=NEW         # Filter by status
```

### Get One
```http
GET /leads/:id
```

### Update
```http
PUT /leads/:id
{
  "name": "New Name",
  "phone": "+1-555-0111"
}
```

### Change Status
```http
PATCH /leads/:id/status
{
  "status": "CONTACTED"
}
```

### Delete
```http
DELETE /leads/:id
```

### Bulk Create
```http
POST /leads/bulk
[ {...}, {...} ]
```

### Bulk Update
```http
PUT /leads/bulk
[ {"id":"123","name":"New"}, {"id":"456","source":"referral"} ]
```

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |

Set `REDIS_HOST`/`REDIS_PORT` to enable Redis caching. If Redis is unreachable, app falls back to in-memory Map automatically.

---

## 📝 License

ISC
