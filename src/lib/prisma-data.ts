import { prisma } from "./prisma";
import { Buyer, BuyerHistory, Prisma, $Enums } from "../generated/prisma";

export async function createBuyer(
  buyerData: Prisma.BuyerCreateInput,
): Promise<Buyer> {
  const buyer = await prisma.buyer.create({
    data: buyerData,
  });
  return buyer;
}

export async function getBuyers(filters?: {
  searchTerm?: string;
  city?: string;
  propertyType?: string;
  status?: string;
  timeline?: string;
}): Promise<Buyer[]> {
  const where: Prisma.BuyerWhereInput = {};

  if (filters) {
    if (filters.searchTerm) {
      where.OR = [
        { fullName: { contains: filters.searchTerm, mode: "insensitive" } },
        { phone: { contains: filters.searchTerm } },
        { email: { contains: filters.searchTerm, mode: "insensitive" } },
        { notes: { contains: filters.searchTerm, mode: "insensitive" } },
      ];
    }

    if (filters.city && filters.city !== "all") {
      where.city = filters.city as $Enums.City;
    }

    if (filters.propertyType && filters.propertyType !== "all") {
      where.propertyType = filters.propertyType as $Enums.PropertyType;
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status as $Enums.BuyerStatus;
    }

    if (filters.timeline && filters.timeline !== "all") {
      where.timeline = filters.timeline as $Enums.Timeline;
    }
  }

  const buyers = await prisma.buyer.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  return buyers;
}

export async function getBuyerById(id: string): Promise<Buyer | null> {
  const buyer = await prisma.buyer.findUnique({
    where: { id },
  });

  if (!buyer) return null;

  return buyer;
}

export async function updateBuyer(
  id: string,
  buyerData: Prisma.BuyerUpdateInput,
): Promise<Buyer> {
  const buyer = await prisma.buyer.update({
    where: { id },
    data: {
      ...buyerData,
      updatedAt: new Date(),
    },
  });

  return buyer;
}

export async function deleteBuyer(id: string): Promise<Buyer> {
  const buyer = await prisma.buyer.delete({
    where: { id },
  });

  return buyer;
}

export async function createBuyerHistory(
  historyData: Prisma.BuyerHistoryUncheckedCreateInput,
): Promise<BuyerHistory> {
  const history = await prisma.buyerHistory.create({
    data: historyData,
  });

  return history;
}

export async function getBuyerHistory(
  buyerId: string,
): Promise<BuyerHistory[]> {
  const history = await prisma.buyerHistory.findMany({
    where: { buyerId },
    orderBy: { changedAt: "desc" },
  });

  return history;
}
