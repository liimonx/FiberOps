# WebSocket Protocol

The network map subscribes to real-time updates when `NEXT_PUBLIC_WS_URL` is set (e.g. `ws://localhost:8080/ws`).

**Frontend files:**

- Handler mock: `src/mocks/handlers.ts` (MSW WebSocket link)
- Client: `src/modules/network-map/services/websocketService.ts`
- Consumer: `src/modules/network-map/hooks/useRealTimeUpdates.ts`
- Schema: `src/modules/network-map/schemas/webSocketMessage.schema.ts`

## Connection

```
URL: ws://<host>:<port>/ws
Protocol: JSON text frames
Direction: Server → Client (primary); Client → Server optional
```

On connect, the server should send a **heartbeat** immediately so the client marks connection quality as `good`.

## Message envelope

All messages are JSON objects with a discriminated `type` field:

```typescript
type WebSocketMessage =
  | { type: "node_update"; data: Partial<NetworkNode> & { id: string }; timestamp?: string }
  | { type: "connection_update"; data: Partial<NetworkConnection> & { id: string }; timestamp?: string }
  | { type: "incident_alert"; data: Record<string, unknown>; timestamp?: string }
  | { type: "status_broadcast"; data: { nodeId: string; status: NetworkStatus; timestamp: string } }
  | { type: "heartbeat"; data: { serverTime: string; connectedClients: number } };
```

Optional top-level `timestamp` should be ISO 8601 (`z.string().datetime()` in Zod).

## Message types

### `heartbeat`

Sent on connect and periodically (recommended every 30 s).

```json
{
  "type": "heartbeat",
  "data": {
    "serverTime": "2026-06-10T14:30:00.000Z",
    "connectedClients": 42
  }
}
```

**Client behavior:** sets connection quality to `good`.

---

### `status_broadcast`

Lightweight asset/node status change. Used by MSW mock every 10 s.

```json
{
  "type": "status_broadcast",
  "data": {
    "nodeId": "pole-main-st-01",
    "status": "ERROR",
    "timestamp": "2026-06-10T14:30:00.000Z"
  }
}
```

**NetworkStatus values:** `ACTIVE` | `INACTIVE` | `WARNING` | `DEGRADED` | `ERROR`

**Client behavior:**

- Ignored when `simulatedOutageActive` is true in map store
- Ignored when `nodeId === "system"`
- Updates node status in Zustand map store via `updateNode(nodeId, { status })`

**Backend mapping from AssetStatus:**

| AssetStatus | NetworkStatus |
|-------------|---------------|
| `active` | `ACTIVE` |
| `degraded` | `WARNING` |
| `down` | `ERROR` |
| `maintenance` | `INACTIVE` |

Use **asset id** as `nodeId` (same id space as REST assets and customer ids for customer nodes).

---

### `node_update`

Full or partial node patch.

```json
{
  "type": "node_update",
  "data": {
    "id": "jb-mohakhali-01",
    "status": "WARNING",
    "utilization": 87
  },
  "timestamp": "2026-06-10T14:30:00.000Z"
}
```

**Client behavior:** merges `data` into existing node via `updateNode(id, data)`.

---

### `connection_update`

Full or partial connection patch.

```json
{
  "type": "connection_update",
  "data": {
    "id": "conn-pop-jb-001",
    "status": "DEGRADED",
    "utilization": 92
  },
  "timestamp": "2026-06-10T14:30:00.000Z"
}
```

**Client behavior:** merges into connection via `updateConnection(id, data)`.

---

### `incident_alert`

New or escalated incident notification. Schema allows arbitrary `data` record.

```json
{
  "type": "incident_alert",
  "data": {
    "incidentId": "inc-005",
    "title": "PoP power failure",
    "severity": "critical",
    "relatedAssetId": "pop-dhaka-01"
  },
  "timestamp": "2026-06-10T14:30:00.000Z"
}
```

**Client behavior today:** logs to console only. Future: toast, map pin, invalidate incidents query.

**Recommended backend trigger:** `POST /api/incidents` and severity escalations.

---

## Server implementation notes

### Fan-out architecture

```
Asset monitor / Incident service
        │
        ▼ publish
   Redis channel: org:{orgId}:network
        │
        ▼ subscribe
 WebSocket gateway (/ws)
        │
        ▼
   Connected map clients
```

### Authentication

Production WebSocket should:

1. Validate session/token on handshake (query param or `Sec-WebSocket-Protocol`)
2. Subscribe client only to their organization's channel
3. Rate-limit broadcasts per connection

### Reconnection

Frontend WebSocket service reconnects automatically. After reconnect, send:

1. Fresh `heartbeat`
2. Optional snapshot message type (future): `topology_snapshot` with full node/connection state

### Simulated outage mode

When the map runs a simulated outage drill, the client **ignores all real-time messages**. No server-side change required.

## MSW mock behavior (development)

The mock server at `ws://localhost:8080/ws`:

1. Sends `heartbeat` on connect
2. Every 10 s, picks a random asset and sends `status_broadcast` with random AssetStatus mapped to NetworkStatus

This matches local dev when MSW browser worker is active.

## Validation

Backend should validate outbound messages against the same discriminated union as `webSocketMessageSchema`. Invalid messages are dropped silently on the client after `safeValidateData` fails.

## Environment

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080/ws` | Frontend connection URL |
| Backend `WS_PATH` | `/ws` | Must match frontend path |

If `NEXT_PUBLIC_WS_URL` is unset, the map runs in static mode without live feed.
