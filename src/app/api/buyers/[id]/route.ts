import { updateBuyerWithHistory, getBuyerById } from "@/lib/buyer-service";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/buyers/[id] - Get a specific buyer
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
    // Get the buyer
    const buyer = await getBuyerById(id);

    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Check if the user owns this buyer
    if (buyer.ownerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(buyer, { status: 200 });
  } catch (error: unknown) {
    console.error("Error fetching buyer:", error);

    return NextResponse.json(
      { error: "Failed to fetch buyer" },
      { status: 500 },
    );
  }
}

// PUT /api/buyers/[id] - Update a specific buyer
export async function PUT(
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

    // Parse the request body
    const body = await request.json();

    const { params } = context;
    const { id } = await params;
    // Get the current buyer to check ownership
    const currentBuyer = await getBuyerById(id);

    if (!currentBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Check if the user owns this buyer
    if (currentBuyer.ownerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for concurrency - compare updatedAt timestamps
    if (body.updatedAt) {
      const clientUpdatedAt = new Date(body.updatedAt);
      const serverUpdatedAt = new Date(currentBuyer.updatedAt);
      
      // If the client's timestamp is older than the server's, reject the update
      if (clientUpdatedAt < serverUpdatedAt) {
        return NextResponse.json(
          { error: "Record changed, please refresh" },
          { status: 409 }
        );
      }
    }

    // Update the buyer
    const updatedBuyer = await updateBuyerWithHistory(id, body, user.id);

    return NextResponse.json(updatedBuyer, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating buyer:", error);

    // Handle validation errors
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update buyer" },
      { status: 500 },
    );
  }
}
