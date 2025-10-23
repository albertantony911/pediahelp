// lib/daily.ts
const DAILY_API = 'https://api.daily.co/v1';

async function dfetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Daily API ${path} failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function createRoomOrReuse(params: {
  roomName: string;
  startMs: number;  // epoch ms
  endMs: number;    // epoch ms
}) {
  const { roomName, startMs, endMs } = params;

  // Try get room
  const existing = await fetch(`${DAILY_API}/rooms/${roomName}`, {
    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}` },
    cache: 'no-store',
  });

  if (existing.ok) {
    return existing.json();
  }

  // Create room (Prebuilt)
  return dfetch('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      properties: {
        eject_at_room_exp: true,                      // kicks everyone when room expires
        exp: Math.floor(endMs / 1000),               // room expiration (unix secs)
        nbf: Math.floor((startMs - 10 * 60 * 1000) / 1000), // "not before": 10m early
        enable_prejoin_ui: true,
        max_participants: 6,                          // adjust if needed
        // You can tweak Prebuilt UI via "properties"
        // see: https://docs.daily.co/reference/rest-api/rooms/create-room
      },
    }),
  });
}

export async function createMeetingToken(params: {
  roomName: string;
  userName?: string;
  isOwner?: boolean;           // true for doctor
  validForSeconds?: number;    // default short (e.g., 10min)
}) {
  const { roomName, userName, isOwner = false, validForSeconds = 600 } = params;

  return dfetch('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        user_name: userName || undefined,
        exp: Math.floor(Date.now() / 1000) + validForSeconds,
      },
    }),
  });
}