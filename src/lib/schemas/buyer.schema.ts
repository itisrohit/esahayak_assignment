import { z } from 'zod';

// Define enums based on Prisma schema
const CityEnum = z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']);
const PropertyTypeEnum = z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail']);
const BHKEnum = z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'Studio']);
const PurposeEnum = z.enum(['Buy', 'Rent']);
const TimelineEnum = z.enum(['ZERO_TO_THREE_M', 'THREE_TO_SIX_M', 'GREATER_THAN_SIX_M', 'Exploring']);
const SourceEnum = z.enum(['Website', 'Referral', 'Walk_in', 'Call', 'Other']);
const BuyerStatusEnum = z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']);

// Schema for buyer form data (client-side validation)
export const BuyerFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Email is invalid').optional().nullable(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15, 'Phone must be at most 15 digits').regex(/^\d+$/, 'Phone must contain only digits'),
  city: CityEnum,
  propertyType: PropertyTypeEnum,
  bhk: z.union([BHKEnum, z.null()]).optional(),
  purpose: PurposeEnum,
  budgetMin: z.number().int().nonnegative().nullable(),
  budgetMax: z.number().int().nonnegative().nullable(),
  timeline: TimelineEnum,
  source: SourceEnum,
  status: BuyerStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()),
});

// Schema for buyer creation (API request validation)
export const CreateBuyerSchema = BuyerFormSchema.extend({
  ownerId: z.string().min(1, 'Owner ID is required'),
});

// Schema for buyer update (API request validation)
export const UpdateBuyerSchema = BuyerFormSchema.partial().extend({
  id: z.string().min(1, 'Buyer ID is required'),
  updatedAt: z.string().datetime().optional(),
});

// Custom validation for budget constraints
export const BudgetValidationSchema = z.object({
  budgetMin: z.number().int().nonnegative().nullable(),
  budgetMax: z.number().int().nonnegative().nullable(),
}).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMin <= data.budgetMax;
    }
    return true;
  },
  {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budgetMax'],
  }
);

// Custom validation for BHK requirement
export const BHKValidationSchema = z.object({
  propertyType: PropertyTypeEnum,
  bhk: z.union([BHKEnum, z.null()]).optional(),
}).refine(
  (data) => {
    const isResidential = ['Apartment', 'Villa'].includes(data.propertyType);
    return !isResidential || (isResidential && data.bhk !== null);
  },
  {
    message: 'BHK is required for residential property types',
    path: ['bhk'],
  }
);

// Type inference
export type BuyerFormData = z.infer<typeof BuyerFormSchema>;
export type CreateBuyerData = z.infer<typeof CreateBuyerSchema>;
export type UpdateBuyerData = z.infer<typeof UpdateBuyerSchema>;