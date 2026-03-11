"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { serverClient } from "@/lib/sanity";

export async function submitResponse(status: "safe" | "need_help", alertId: string, lat?: number, lng?: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const memberId = (session.user as { id?: string }).id;
  if (!memberId) throw new Error("Unauthorized");

  const existing = await serverClient.fetch<{ _id: string } | null>(
    `*[_type == "alertResponse" && member._ref == $memberId && alert._ref == $alertId][0]{ _id }`,
    { memberId, alertId }
  );

  const doc = {
    _type: "alertResponse",
    member: { _type: "reference", _ref: memberId },
    alert: { _type: "reference", _ref: alertId },
    status,
    adminMarkedSafe: false,
    respondedAt: new Date().toISOString(),
    ...(typeof lat === "number" && typeof lng === "number" && { lat, lng }),
  };

  if (existing) {
    const patch: Record<string, unknown> = { status, respondedAt: doc.respondedAt };
    if (typeof lat === "number") patch.lat = lat;
    if (typeof lng === "number") patch.lng = lng;
    await serverClient.patch(existing._id).set(patch).commit();
  } else {
    await serverClient.create(doc);
  }
  await serverClient.create({
    _type: "statusChange",
    member: { _type: "reference", _ref: memberId },
    alert: { _type: "reference", _ref: alertId },
    status,
    changedBy: { _type: "reference", _ref: memberId },
    changedAt: new Date().toISOString(),
  });
  revalidatePath("/dashboard");
}

export async function updateProfile(data: {
  fullName: string;
  phone: string;
  address: string;
  medicalConditions?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const memberId = (session.user as { id?: string }).id;
  if (!memberId) throw new Error("Unauthorized");

  await serverClient
    .patch(memberId)
    .set({
      fullName: data.fullName,
      phone: data.phone ?? "",
      address: data.address ?? "",
      medicalConditions: data.medicalConditions?.trim() ?? "",
    })
    .commit();
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

export async function createAlert(title: string, subtitle: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") throw new Error("Forbidden");
  const memberId = (session.user as { id?: string }).id;
  if (!memberId) throw new Error("Unauthorized");

  const activeAlertIds = await serverClient.fetch<string[]>(
    `*[_type == "alert" && status == "active"]._id`
  );
  for (const id of activeAlertIds) {
    await serverClient.patch(id).set({ status: "closed" }).commit();
  }

  await serverClient.create({
    _type: "alert",
    title,
    subtitle: subtitle || "",
    createdAt: new Date().toISOString(),
    createdBy: { _type: "reference", _ref: memberId },
    status: "active",
  });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export type MemberResponseStatus = "safe" | "need_help" | "unconfirmed";

export async function setMemberResponseStatus(
  memberId: string,
  alertId: string,
  status: MemberResponseStatus
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as { role?: string }).role !== "admin") throw new Error("Forbidden");
  const adminMemberId = (session.user as { id?: string }).id;
  if (!adminMemberId) throw new Error("Unauthorized");

  const response = await serverClient.fetch<{ _id: string } | null>(
    `*[_type == "alertResponse" && member._ref == $memberId && alert._ref == $alertId][0]{ _id }`,
    { memberId, alertId }
  );
  const adminMarkedSafe = status === "safe";
  const payload = {
    status,
    adminMarkedSafe,
    ...(adminMarkedSafe
      ? { markedSafeBy: { _type: "reference" as const, _ref: adminMemberId } }
      : { markedSafeBy: null }),
  };
  if (response) {
    await serverClient.patch(response._id).set(payload).commit();
  } else {
    await serverClient.create({
      _type: "alertResponse",
      member: { _type: "reference", _ref: memberId },
      alert: { _type: "reference", _ref: alertId },
      ...payload,
      respondedAt: new Date().toISOString(),
    } as Parameters<typeof serverClient.create>[0]);
  }
  await serverClient.create({
    _type: "statusChange",
    member: { _type: "reference", _ref: memberId },
    alert: { _type: "reference", _ref: alertId },
    status,
    changedBy: { _type: "reference", _ref: adminMemberId },
    changedAt: new Date().toISOString(),
  });
  revalidatePath("/admin/members");
  revalidatePath("/admin");
}

export async function archiveAlert(alertId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as { role?: string }).role !== "admin") throw new Error("Forbidden");

  await serverClient.patch(alertId).set({ status: "closed" }).commit();
  revalidatePath("/admin");
  revalidatePath("/admin/archives");
  revalidatePath("/dashboard");
}

export async function unarchiveAlert(alertId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if ((session.user as { role?: string }).role !== "admin") throw new Error("Forbidden");

  await serverClient.patch(alertId).set({ status: "active" }).commit();
  revalidatePath("/admin");
  revalidatePath("/admin/archives");
  revalidatePath("/dashboard");
}

export async function adminMarkSafe(memberId: string, alertId: string, markedSafe: boolean) {
  await setMemberResponseStatus(memberId, alertId, markedSafe ? "safe" : "need_help");
}

export async function updateLastKnownLocation(lat: number, lng: number) {
  const session = await auth();
  if (!session?.user) return;
  const memberId = (session.user as { id?: string }).id;
  if (!memberId) return;

  await serverClient
    .patch(memberId)
    .set({ lastKnownLat: lat, lastKnownLng: lng })
    .commit();
}
