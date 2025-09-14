import { getBuyerWithHistory } from "@/lib/buyer-service";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/buyers/[id]/history - Get buyer history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Get the authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { params } = context;
    const { id } = await params;
    // Get buyer history
    const result = await getBuyerWithHistory(id);

    if (!result) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    return NextResponse.json(result.history, { status: 200 });
  } catch (error) {
    console.error("Error fetching buyer history:", error);

    return NextResponse.json(
      { error: "Failed to fetch buyer history" },
      { status: 500 },
    );
  }
}
