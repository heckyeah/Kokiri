import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { serverClient } from "@/lib/sanity";

const SEED_SECRET = process.env.SEED_SECRET;

const KENNEDY_BAY_MEMBERS = [
  { fullName: "Sarah Mitchell", address: "1186 Kennedy Bay Road, Kennedy Bay, Coromandel, New Zealand", phone: "027 123 4567" },
  { fullName: "James Cooper", address: "1182 Kennedy Bay Road, Kennedy Bay, Coromandel, New Zealand", phone: "027 234 5678" },
  { fullName: "Emma Wilson", address: "1174 Kennedy Bay Road, Kennedy Bay, Coromandel, New Zealand", phone: "027 345 6789" },
  { fullName: "David Thompson", address: "1160 Kennedy Bay Road, Kennedy Bay, Coromandel, New Zealand", phone: "027 456 7890" },
  { fullName: "Lisa Bennett", address: "1128 Kennedy Bay Road, Kennedy Bay, Coromandel, New Zealand", phone: "027 567 8901" },
  { fullName: "Michael Roberts", address: "12 Moana Crescent, Kennedy Bay, Coromandel, New Zealand", phone: "027 678 9012" },
  { fullName: "Rachel Taylor", address: "4B Moana Crescent, Kennedy Bay, Coromandel, New Zealand", phone: "027 789 0123" },
];

export async function POST(request: Request) {
  if (!SEED_SECRET) {
    return NextResponse.json(
      { error: "Set SEED_SECRET in .env.local to run seed." },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  let bodySecret: string | null = null;
  try {
    const b = await request.json() as { secret?: string };
    bodySecret = b?.secret ?? null;
  } catch {
    // no body
  }
  if (bearer !== SEED_SECRET && bodySecret !== SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const passwordHash = await bcrypt.hash("seedpassword1", 12);

    const existingAlert = await serverClient.fetch<{ _id: string } | null>(
      `*[_type == "alert" && status == "active"][0]{ _id }`
    );
    let alertId: string;
    if (existingAlert?._id) {
      alertId = existingAlert._id;
    } else {
      const alerts = await serverClient.fetch<{ _id: string }[]>(
        `*[_type == "alert"] | order(createdAt desc)[0..0]{ _id }`
      );
      if (alerts.length === 0) {
        const created = await serverClient.create({
          _type: "alert",
          title: "Kōkiri Test Alert",
          subtitle: "Seed alert for Kennedy Bay members",
          createdAt: new Date().toISOString(),
          status: "active",
        });
        alertId = created._id;
      } else {
        await serverClient.patch(alerts[0]._id).set({ status: "active" }).commit();
        alertId = alerts[0]._id;
      }
    }

    const memberIds: string[] = [];
    for (let i = 0; i < KENNEDY_BAY_MEMBERS.length; i++) {
      const m = KENNEDY_BAY_MEMBERS[i];
      const email = `kennedy-bay-${i + 1}@example.com`;
      const existing = await serverClient.fetch<{ _id: string } | null>(
        `*[_type == "member" && email == $email][0]{ _id }`,
        { email }
      );
      if (existing) {
        memberIds.push(existing._id);
        continue;
      }
      const doc = await serverClient.create({
        _type: "member",
        fullName: m.fullName,
        email,
        phone: m.phone ?? "",
        address: m.address,
        medicalConditions: "",
        passwordHash,
        role: "member",
      });
      memberIds.push(doc._id);
    }

    for (const memberId of memberIds) {
      const existingResponse = await serverClient.fetch<{ _id: string } | null>(
        `*[_type == "alertResponse" && member._ref == $memberId && alert._ref == $alertId][0]{ _id }`,
        { memberId, alertId }
      );
      if (existingResponse) {
        await serverClient
          .patch(existingResponse._id)
          .set({
            status: "need_help",
            respondedAt: new Date().toISOString(),
            adminMarkedSafe: false,
          })
          .commit();
      } else {
        await serverClient.create({
          _type: "alertResponse",
          member: { _type: "reference", _ref: memberId },
          alert: { _type: "reference", _ref: alertId },
          status: "need_help",
          adminMarkedSafe: false,
          respondedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Created 7 Kennedy Bay members and marked them as needing help.",
      alertId,
      memberIds,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed." },
      { status: 500 }
    );
  }
}
