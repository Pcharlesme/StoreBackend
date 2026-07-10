# LastCall Marketplace API

A RESTful backend API for the LastCall STORE built with Node.js, Express, TypeScript, MongoDB, AWS S3 and JWT Authentication.

## Features

- User Registration
- User Login (JWT Authentication)
- User Profile Management
- Marketplace Listings
- Search Listings
- Pagination
- Listing Status Management
- Automatic Listing Expiry (Cron Job)
- Request Validation (Zod)
- Rate Limiting
- Logging Middleware

---

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB
- JWT
- Zod
- bcrypt
- express-rate-limit
- node-cron

---

## Installation

```bash
git clone <repository>

cd LastcallServer

npm install
```

Create a `.env`

```env
PORT=3000

MONGO_URI=your_mongodb_connection

JWT_SECRET=your_secret_key

JWT_EXPIRES_IN=7d
```

Start the server

```bash
npm run dev
```

---

# Authentication

Protected endpoints require:

```
Authorization: Bearer <access_token>
```

---

# API Endpoints

## Authentication

### Register

```
POST /auth/signup
```

Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Login

```
POST /auth/login
```

Returns

```json
{
  "success": true,
  "accessToken": "...",
  "user": {
    "id": "...",
    "email": "john@example.com"
  }
}
```

---

# User

## Current User

```
GET /users/me
```
Protected
---

## Update Profile

```
PATCH /users/me
```

Protected

---

## Delete Account

```
DELETE /users/me
```

Protected

---

## Public User Profile

```
GET /users/:id
```

---

## Current User Listings

```
GET /users/me/listings
```

Protected

Returns all listings owned by the authenticated user.

---

# Listings

## Create Listing

```
POST /listings
```

Protected

---

## Update Listing

```
PATCH /listings/:id
```

Protected

---

## Delete Listing

```
DELETE /listings/:id
```

Protected

---

## Update Listing Status

```
PATCH /listings/status/:id
```

Protected

Status values

- ACTIVE
- SOLD
- EXPIRED
- DELETED

---

## Get Listings

```
GET /listings
```

Supports pagination

Example

```
GET /listings?page=1&limit=10
```

Only ACTIVE listings are returned.

---

## Search Listings

```
GET /listings/search
```

Example

```
GET /listings/search?search=chair&page=1&limit=10
```

Searches

- title
- description
- category

Only ACTIVE listings are returned.

---

## Get Listing

```
GET /listings/:id
```

---

# Validation

All request bodies are validated using Zod.

Invalid requests return

```
400 Bad Request
```

---

# Security

- JWT Authentication
- Password Hashing (bcrypt)
- Rate Limiting
- Request Validation
- Secure Password Storage

---

# Automated Tasks

A scheduled cron job runs every 15 minutes.

It automatically updates listings that have passed their expiry date.

```
ACTIVE

↓

EXPIRED
```

---

# Project Structure

```
src/

controllers/

middleware/

routes/

schemas/

config/

utils/

types/
```

---

# Future Improvements

- Google Authentication
- Refresh Tokens
- Image Upload (AWS S3)
- Seller Profiles
- Reservations
- Chat
- Notifications
- Favorites
- Super Admin
- Swagger API Documentation

---

# License

MIT