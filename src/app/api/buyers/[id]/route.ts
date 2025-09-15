import { updateBuyerWithHistory, getBuyerById, deleteBuyerWithHistory } from "@/lib/buyer-service";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited, getRateLimitHeaders } from "@/lib/rate-limiter";
import { NextRequest, NextResponse } from "next/server";
import { UpdateBuyerSchema } from "@/lib/schemas/buyer.schema";
import { z } from "zod";

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

    // Anyone logged in can read any buyer (no ownership check needed)
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
    // Check rate limit
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            ...getRateLimitHeaders(request),
            'Retry-After': '60'
          }
        }
      );
    }
    
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

    // Validate request body with Zod
    const validatedData = UpdateBuyerSchema.parse({
      id,
      ...body,
    });

    // Update the buyer
    const updatedBuyer = await updateBuyerWithHistory(id, validatedData, user.id);
    
    const rateLimitHeaders = getRateLimitHeaders(request);

    return NextResponse.json(updatedBuyer, { 
      status: 200,
      headers: rateLimitHeaders
    });
  } catch (error: unknown) {
    console.error("Error updating buyer:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errorMessages
        },
        { status: 400 }
      );
    }

    // Handle other validation errors
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update buyer" },
      { status: 500 },
    );
  }
}

// DELETE /api/buyers/[id] - Delete a specific buyer
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // Check rate limit
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            ...getRateLimitHeaders(request),
            'Retry-After': '60'
          }
        }
      );
    }
    
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
    // Get the current buyer to check ownership
    const currentBuyer = await getBuyerById(id);

    if (!currentBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    // Check if the user owns this buyer
    if (currentBuyer.ownerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the buyer
    const deletedBuyer = await deleteBuyerWithHistory(id, user.id);
    
    const rateLimitHeaders = getRateLimitHeaders(request);

    return NextResponse.json(deletedBuyer, { 
      status: 200,
      headers: rateLimitHeaders
    });
  } catch (error: unknown) {
    console.error("Error deleting buyer:", error);

    // Handle validation errors
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete buyer" },
      { status: 500 },
    );
  }
}
