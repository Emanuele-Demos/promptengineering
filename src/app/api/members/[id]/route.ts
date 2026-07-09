import { NextResponse } from "next/server";
import { deleteMember } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = deleteMember(id);

  if (!deleted) {
    return NextResponse.json({ error: "Membro non trovato" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
