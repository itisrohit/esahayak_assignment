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

// Function to validate budget constraints
export function validateBudget(budgetMin: number | null, budgetMax: number | null): void {
  if (budgetMin && budgetMax && budgetMin > budgetMax) {
    throw new Error("budgetMin must be less than or equal to budgetMax");
  }
}

// Function to create a new buyer
export async function createNewBuyer(
  buyerData: Omit<Buyer, "id" | "updatedAt" | "createdAt">,
): Promise<Buyer> {
  // Validate budget constraints
  validateBudget(buyerData.budgetMin, buyerData.budgetMax);

  // For non-residential property types, BHK is optional
  const isResidential = ["Apartment", "Villa"].includes(buyerData.propertyType);
  if (isResidential && !buyerData.bhk) {
    throw new Error("BHK is required for residential property types");
  }

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

  // Validate budget constraints
  const budgetMin = buyerData.budgetMin ?? currentBuyer.budgetMin;
  const budgetMax = buyerData.budgetMax ?? currentBuyer.budgetMax;
  if (budgetMin && budgetMax && budgetMin > budgetMax) {
    throw new Error("budgetMin must be less than or equal to budgetMax");
  }

  // For non-residential property types, BHK is optional
  const propertyType = buyerData.propertyType ?? currentBuyer.propertyType;
  const isResidential = ["Apartment", "Villa"].includes(propertyType);
  const bhk = buyerData.bhk ?? currentBuyer.bhk;
  if (isResidential && !bhk) {
    throw new Error("BHK is required for residential property types");
  }

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
