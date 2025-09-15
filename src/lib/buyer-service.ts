import { Buyer, BuyerHistory, Prisma } from "../generated/prisma";
import {
  createBuyer,
  getBuyers,
  getBuyerById as getBuyerByIdFromDb,
  updateBuyer,
  deleteBuyer,
  createBuyerHistory,
  getBuyerHistory as getBuyerHistoryFromDb,
} from "./prisma-data";
import { 
  BudgetValidationSchema, 
  BHKValidationSchema, 
  CreateBuyerSchema,
  UpdateBuyerSchema
} from "./schemas/buyer.schema";
import { z } from "zod";

// Function to validate budget constraints
export function validateBudget(budgetMin: number | null, budgetMax: number | null): void {
  const result = BudgetValidationSchema.safeParse({ budgetMin, budgetMax });
  if (!result.success) {
    // Throw a specific error message that matches the test expectation
    if (budgetMin && budgetMax && budgetMin > budgetMax) {
      throw new Error("budgetMin must be less than or equal to budgetMax");
    }
    // Fallback to the first error message
    throw new Error(result.error.issues[0]?.message || "Budget validation failed");
  }
}

// Function to validate BHK requirement
export function validateBHK(propertyType: string, bhk: string | null): void {
  const result = BHKValidationSchema.safeParse({ propertyType, bhk });
  if (!result.success) {
    // Throw a specific error message that matches the test expectation
    if (['Apartment', 'Villa'].includes(propertyType) && !bhk) {
      throw new Error("BHK is required for residential property types");
    }
    // Fallback to the first error message
    throw new Error(result.error.issues[0]?.message || "BHK validation failed");
  }
}

// Function to create a new buyer
export async function createNewBuyer(
  buyerData: Omit<Buyer, "id" | "updatedAt" | "createdAt">,
): Promise<Buyer> {
  // Validate with Zod schema
  try {
    CreateBuyerSchema.parse(buyerData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`);
    }
    throw error;
  }

  // Validate budget constraints
  validateBudget(buyerData.budgetMin, buyerData.budgetMax);

  // Validate BHK requirement
  validateBHK(buyerData.propertyType, buyerData.bhk || null);

  // Create the buyer
  const buyer = await createBuyer(buyerData as Buyer);

  // Create initial history entry
  if (!buyer.ownerId) {
    throw new Error("ownerId is missing");
  }
  const historyData: Prisma.BuyerHistoryUncheckedCreateInput = {
    buyerId: buyer.id,
    changedBy: buyer.ownerId,
    diff: JSON.parse(JSON.stringify({ action: "created", data: buyer })),
  };

  await createBuyerHistory(historyData);

  return buyer;
}

// Function to update a buyer and track changes
export async function updateBuyerWithHistory(
  id: string,
  buyerData: Partial<Omit<Buyer, "id" | "updatedAt" | "createdAt">>,
  userId: string,
): Promise<Buyer> {
  // Get the current buyer data
  const currentBuyer = await getBuyerByIdFromDb(id);
  if (!currentBuyer) {
    throw new Error("Buyer not found");
  }

  // Merge current data with updated data for validation
  const mergedData = {
    ...currentBuyer,
    ...buyerData,
  };

  // Validate with Zod schema
  try {
    UpdateBuyerSchema.parse(mergedData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues[0].message}`);
    }
    throw error;
  }

  // Validate budget constraints
  const budgetMin = buyerData.budgetMin ?? currentBuyer.budgetMin;
  const budgetMax = buyerData.budgetMax ?? currentBuyer.budgetMax;
  validateBudget(budgetMin, budgetMax);

  // Validate BHK requirement
  const propertyType = buyerData.propertyType ?? currentBuyer.propertyType;
  const bhk = buyerData.bhk ?? currentBuyer.bhk;
  validateBHK(propertyType, bhk);

  // Update the buyer
  const updatedBuyer = await updateBuyer(id, buyerData);

  // Track changes in history
  const diff: Record<string, { oldValue: unknown; newValue: unknown }> = {};
  for (const [key, value] of Object.entries(buyerData)) {
    if (value !== (currentBuyer as Record<string, unknown>)[key]) {
      diff[key] = {
        oldValue: (currentBuyer as Record<string, unknown>)[key],
        newValue: value,
      };
    }
  }

  // Only create history entry if there are changes
  if (Object.keys(diff).length > 0) {
    const historyData: Prisma.BuyerHistoryUncheckedCreateInput = {
      buyerId: id,
      changedBy: userId,
      diff: JSON.parse(JSON.stringify(diff)),
    };

    await createBuyerHistory(historyData);
  }

  return updatedBuyer;
}

// Function to get buyers with pagination
export async function getBuyersWithPagination(
  page: number = 1,
  limit: number = 10,
  filters?: {
    searchTerm?: string;
    city?: string;
    propertyType?: string;
    status?: string;
    timeline?: string;
    ownerId?: string; // Add ownerId filter
  },
): Promise<{ buyers: Buyer[]; totalCount: number }> {
  // Get filtered buyers
  const buyers = await getBuyers(filters);

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const paginatedBuyers = buyers.slice(startIndex, startIndex + limit);
  const totalCount = buyers.length;

  return {
    buyers: paginatedBuyers,
    totalCount,
  };
}

// Function to delete a buyer
export async function deleteBuyerWithHistory(
  id: string,
  userId: string,
): Promise<Buyer> {
  // Create a history entry before deletion
  const buyer = await getBuyerByIdFromDb(id);
  if (!buyer) {
    throw new Error("Buyer not found");
  }

  const historyData: Prisma.BuyerHistoryUncheckedCreateInput = {
    buyerId: id,
    changedBy: userId,
    diff: JSON.parse(JSON.stringify({ action: "deleted", data: buyer })),
  };

  await createBuyerHistory(historyData);

  // Delete the buyer
  return await deleteBuyer(id);
}

// Function to get buyer with history
export async function getBuyerWithHistory(
  id: string,
): Promise<{ buyer: Buyer; history: BuyerHistory[] } | null> {
  const buyer = await getBuyerByIdFromDb(id);
  if (!buyer) {
    return null;
  }

  const history = await getBuyerHistoryFromDb(id);

  return {
    buyer,
    history,
  };
}

export const getBuyerById = getBuyerByIdFromDb;
export const getBuyerHistory = getBuyerHistoryFromDb;
