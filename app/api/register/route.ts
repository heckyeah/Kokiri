import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { serverClient } from "@/lib/sanity";
import { MEMBER_BY_EMAIL_QUERY } from "@/lib/queries";

const registerSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Invalid email").transform((e) => e.trim().toLowerCase()),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  medicalConditions: z.string().max(1000).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { fullName, email, phone, address, medicalConditions, password } = parsed.data;

    const existing = await serverClient.fetch<{ _id: string } | null>(
      MEMBER_BY_EMAIL_QUERY,
      { email }
    );
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const doc = {
      _type: "member",
      fullName,
      email,
      phone: phone ?? "",
      address: address ?? "",
      medicalConditions: medicalConditions?.trim() ?? "",
      passwordHash,
      role: "member",
    };

    await serverClient.create(doc);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 }
    );
  }
}
