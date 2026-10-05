# QForge Realtime Quiz PoC

## Run locally

Terminal 1:

```bash
cd server
npm install
npm run dev
```

Terminal 2:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in one tab as Host and additional tabs as Players. The server owns room state, quiz timing, answer validation and result calculation; all state is in memory.
