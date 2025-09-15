import { PrismaClient, $Enums } from '../src/generated/prisma';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create sample buyers
  const sampleBuyers = [
    {
      id: randomUUID(),
      fullName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      city: $Enums.City.Chandigarh,
      propertyType: $Enums.PropertyType.Apartment,
      bhk: $Enums.BHK.TWO,
      purpose: $Enums.Purpose.Buy,
      budgetMin: 500000,
      budgetMax: 750000,
      timeline: $Enums.Timeline.THREE_TO_SIX_M,
      source: $Enums.Source.Website,
      status: $Enums.BuyerStatus.New,
      notes: 'Looking for a 2BHK with a balcony.',
      tags: ['Hot Lead', 'Follow Up'],
      ownerId: 'user_123',
    },
    {
      id: randomUUID(),
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1987654321',
      city: $Enums.City.Mohali,
      propertyType: $Enums.PropertyType.Villa,
      bhk: $Enums.BHK.THREE,
      purpose: $Enums.Purpose.Rent,
      budgetMin: 1200000,
      budgetMax: 1800000,
      timeline: $Enums.Timeline.ZERO_TO_THREE_M,
      source: $Enums.Source.Referral,
      status: $Enums.BuyerStatus.Qualified,
      notes: 'Interested in properties with a large backyard.',
      tags: ['Cold Lead'],
      ownerId: 'user_456',
    },
    {
      id: randomUUID(),
      fullName: 'Robert Johnson',
      email: 'robert.johnson@example.com',
      phone: '+1122334455',
      city: $Enums.City.Zirakpur,
      propertyType: $Enums.PropertyType.Plot,
      bhk: null,
      purpose: $Enums.Purpose.Buy,
      budgetMin: 800000,
      budgetMax: 1200000,
      timeline: $Enums.Timeline.GREATER_THAN_SIX_M,
      source: $Enums.Source.Walk_in,
      status: $Enums.BuyerStatus.Contacted,
      notes: 'Looking for a commercial plot.',
      tags: ['Commercial', 'Site Visit'],
      ownerId: 'user_789',
    },
    {
      id: randomUUID(),
      fullName: 'Emily Davis',
      email: 'emily.davis@example.com',
      phone: '+9988776655',
      city: $Enums.City.Panchkula,
      propertyType: $Enums.PropertyType.Office,
      bhk: null,
      purpose: $Enums.Purpose.Rent,
      budgetMin: 20000,
      budgetMax: 35000,
      timeline: $Enums.Timeline.Exploring,
      source: $Enums.Source.Call,
      status: $Enums.BuyerStatus.Visited,
      notes: 'Looking for office space for 20 employees.',
      tags: ['Office Space', 'Corporate'],
      ownerId: 'user_123',
    },
    {
      id: randomUUID(),
      fullName: 'Michael Wilson',
      email: null,
      phone: '+5566778899',
      city: $Enums.City.Other,
      propertyType: $Enums.PropertyType.Retail,
      bhk: null,
      purpose: $Enums.Purpose.Buy,
      budgetMin: 5000000,
      budgetMax: 8000000,
      timeline: $Enums.Timeline.THREE_TO_SIX_M,
      source: $Enums.Source.Other,
      status: $Enums.BuyerStatus.Negotiation,
      notes: 'Interested in retail space in a mall.',
      tags: ['Retail', 'Investment'],
      ownerId: 'user_456',
    },
  ];

  // Insert buyers
  for (const buyerData of sampleBuyers) {
    const buyer = await prisma.buyer.create({
      data: buyerData,
    });
    console.log(`Created buyer with id: ${buyer.id}`);
    
    // Create some history entries for this buyer
    const historyEntries = [
      {
        id: randomUUID(),
        buyerId: buyer.id,
        changedBy: buyer.ownerId,
        diff: JSON.stringify({ 
          action: 'created', 
          data: { 
            fullName: buyer.fullName, 
            status: 'New' 
          } 
        }),
      },
      {
        id: randomUUID(),
        buyerId: buyer.id,
        changedBy: buyer.ownerId,
        diff: JSON.stringify({ 
          status: { 
            oldValue: 'New', 
            newValue: buyer.status 
          } 
        }),
      }
    ];
    
    // Insert history entries
    for (const historyData of historyEntries) {
      const history = await prisma.buyerHistory.create({
        data: historyData,
      });
      console.log(`Created history entry with id: ${history.id} for buyer: ${buyer.id}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });