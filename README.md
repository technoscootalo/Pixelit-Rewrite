# Pixelit

<p align="center">
  <img src="https://i.postimg.cc/59Z7dfVf/image.png" width="800"/>
</p>

---

## About

Pixelit is **The #1 Pixelated Web Trading Game**, Rebuilt entirely in NodeJS.

---

## Tech Stack

<p align="center">

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-black?style=for-the-badge&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</p>

---

## Self-host guide

### Prerequisites

- **Node.js** (LTS recommended)
- **MongoDB** (local or hosted)
- A server where you can run Node (Linux recommended)

> This project uses Express + MongoDB + Socket.IO.

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

1. Copy the example env file:

```bash
cp .env.example .env
```

2. Edit `.env` and set at least:

- `MONGO_URI`
- `SESSION_SECRET`

> `PAYPAL_WEBHOOK_SECRET` is optional (only needed if you use the PayPal booster activation webhook).

### 3) Run the server

```bash
node server.js
```

- Default port: `http://localhost:3000`
- If you changed `PORT` in `.env`, use that instead.

### Environment variables

| Variable | Required | Used for |
|---|---:|---|
| `MONGO_URI` | ✅ | MongoDB connection |
| `SESSION_SECRET` | ✅ | Express session signing |
| `PORT` | — | Server port (default `3000`) |
| `CORS_ORIGIN` | — | Socket.IO/CORS origin (default `http://localhost:3000`) |
| `PAYPAL_WEBHOOK_SECRET` | (optional) | PayPal webhook authorization |
| `BOT_TOKEN` | (optional) | Discord bot token |
| `CLIENT_ID` | (optional) | Discord app/client id |
| `GUILD_ID` | (optional) | Discord guild/server id |

### (Optional) Run the Discord bot

If you want the Discord slash commands / badge syncing:

```bash
node bot/bot.js
```

### Common self-host checklist

- [ ] MongoDB is reachable from where the server runs
- [ ] `.env` exists and is **not** committed
- [ ] Visit `http://localhost:3000` and confirm pages load
- [ ] Register/login to ensure sessions work

---

## Contributers

- **IzumiiHD**
- **Iamgamedude**
- **Lemon**
- **SOUNDGOD**
- **Packman28**
- **Buenar**
- **Dylan**
- **Prq**
- **Hjr**
- **FastyJay**
- **FrostyIce109**

---

## Notes

> Pixelit is an independent project and is not affiliated with Blooket LLC in any sort of way.

> Security note: keep `SESSION_SECRET` private and never share or commit your `.env`.
