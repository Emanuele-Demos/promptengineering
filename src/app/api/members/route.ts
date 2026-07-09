import { NextResponse } from "next/server";
import { createMember, getAll } from "@/lib/db";

export async function GET() {
  const { members } = getAll();
  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Nome e email sono obbligatori" },
      { status: 400 },
    );
  }

  const member = createMember({ name, email });
  return NextResponse.json(member, { status: 201 });
}
