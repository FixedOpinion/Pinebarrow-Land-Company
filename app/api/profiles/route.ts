import { getD1 } from "../../../db";

const DEVICE_HEADER = "x-pinebarrow-device";
const DEVICE_COOKIE = "pinebarrow_device";
const MAX_SAVE_BYTES = 750_000;

function deviceIdFrom(request: Request): string | null {
  const cookieValue = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DEVICE_COOKIE}=`))
    ?.slice(DEVICE_COOKIE.length + 1) ?? "";
  const value = cookieValue || request.headers.get(DEVICE_HEADER)?.trim() || "";
  return /^[A-Za-z0-9_-]{20,96}$/.test(value) ? value : null;
}

function profileHeaders(deviceId: string) {
  return {
    "cache-control": "no-store",
    "set-cookie": `${DEVICE_COOKIE}=${deviceId}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
  };
}

function validSlot(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 3;
}

function cleanName(value: unknown, slot: number): string {
  const name = typeof value === "string" ? value.trim().slice(0, 28) : "";
  return name || `Pinebarrow Company ${slot}`;
}

type ProfileRow = {
  slot: number;
  name: string;
  save_json: string;
  updated_at: number;
};

function profileResponse(row: ProfileRow) {
  let save: unknown = null;
  try {
    save = JSON.parse(row.save_json);
  } catch {
    save = null;
  }
  return {
    slot: row.slot,
    name: row.name,
    save,
    updatedAt: row.updated_at,
  };
}

function routeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected save error";
  const unavailable = message.includes("no such table") || message.includes("game_profiles");
  return Response.json(
    { error: unavailable ? "Company-file storage is not ready yet." : "Company files could not be saved." },
    { status: 500 },
  );
}

export async function GET(request: Request) {
  const deviceId = deviceIdFrom(request);
  if (!deviceId) return Response.json({ error: "Invalid device key." }, { status: 400 });

  try {
    const db = await getD1();
    const result = await db
      .prepare("SELECT slot, name, save_json, updated_at FROM game_profiles WHERE device_id = ? ORDER BY slot ASC")
      .bind(deviceId)
      .all<ProfileRow>();
    return Response.json({ profiles: result.results.map(profileResponse) }, { headers: profileHeaders(deviceId) });
  } catch (error) {
    return routeError(error);
  }
}

export async function PUT(request: Request) {
  const deviceId = deviceIdFrom(request);
  if (!deviceId) return Response.json({ error: "Invalid device key." }, { status: 400 });

  try {
    const payload = (await request.json()) as { slot?: unknown; name?: unknown; save?: unknown };
    if (!validSlot(payload.slot) || !payload.save || typeof payload.save !== "object") {
      return Response.json({ error: "A valid company file is required." }, { status: 400 });
    }

    const slot = Number(payload.slot);
    const name = cleanName(payload.name, slot);
    const saveJson = JSON.stringify(payload.save);
    if (new TextEncoder().encode(saveJson).byteLength > MAX_SAVE_BYTES) {
      return Response.json({ error: "This company file is too large." }, { status: 413 });
    }

    const now = Date.now();
    const id = `${deviceId}:${slot}`;
    const db = await getD1();
    const results = await db.batch([
      db.prepare("INSERT INTO game_profiles (id, device_id, slot, name, save_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (device_id, slot) DO UPDATE SET name = excluded.name, save_json = excluded.save_json, updated_at = excluded.updated_at")
        .bind(id, deviceId, slot, name, saveJson, now, now),
      db.prepare("SELECT slot, name, save_json, updated_at FROM game_profiles WHERE device_id = ? AND slot = ? LIMIT 1")
        .bind(deviceId, slot),
    ]);
    const row = results[1]?.results?.[0] as ProfileRow | undefined;
    if (!row) throw new Error("Company file was not returned after saving.");
    return Response.json({ profile: profileResponse(row) }, { headers: profileHeaders(deviceId) });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request) {
  const deviceId = deviceIdFrom(request);
  if (!deviceId) return Response.json({ error: "Invalid device key." }, { status: 400 });

  try {
    const payload = (await request.json()) as { slot?: unknown };
    if (!validSlot(payload.slot)) return Response.json({ error: "Invalid company file." }, { status: 400 });
    const db = await getD1();
    await db
      .prepare("DELETE FROM game_profiles WHERE device_id = ? AND slot = ?")
      .bind(deviceId, Number(payload.slot))
      .run();
    return Response.json({ deleted: true }, { headers: profileHeaders(deviceId) });
  } catch (error) {
    return routeError(error);
  }
}
