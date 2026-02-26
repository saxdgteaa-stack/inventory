import {
  PrismaClient,
  UserRole,
  PaymentMethod,
  ExpenseStatus,
  StockMovementType,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth-utils";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.dailyClosing.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Cleaned existing data");

  // Create users
  const ownerPassword = await hashPassword("owner123");
  const owner = await prisma.user.create({
    data: {
      email: "owner@lsms.com",
      name: "John Kamau",
      password: ownerPassword,
      role: UserRole.OWNER,
      isActive: true,
    },
  });

  const sellerPassword = await hashPassword("seller123");
  const seller1 = await prisma.user.create({
    data: {
      email: "seller@lsms.com",
      name: "Mary Wanjiku",
      password: sellerPassword,
      role: UserRole.SELLER,
      isActive: true,
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: "seller2@lsms.com",
      name: "Peter Ochieng",
      password: sellerPassword,
      role: UserRole.SELLER,
      isActive: true,
    },
  });
  console.log("✅ Created users");

  // Create product categories
  const whiskeyCat = await prisma.category.create({
    data: { name: "Whiskey", description: "Whiskey and bourbon" },
  });
  const vodkaCat = await prisma.category.create({
    data: { name: "Vodka", description: "Vodka spirits" },
  });
  const rumCat = await prisma.category.create({
    data: { name: "Rum", description: "Rum and spiced rum" },
  });
  const ginCat = await prisma.category.create({
    data: { name: "Gin", description: "Gin spirits" },
  });
  const beerCat = await prisma.category.create({
    data: { name: "Beer", description: "Beer and lagers" },
  });
  const wineCat = await prisma.category.create({
    data: { name: "Wine", description: "Red and white wines" },
  });
  const liqueurCat = await prisma.category.create({
    data: { name: "Liqueur", description: "Liqueurs and spirits" },
  });
  const brandyCat = await prisma.category.create({
    data: { name: "Brandy", description: "Brandy and cognac" },
  });
  console.log("✅ Created product categories");

  // Create expense categories
  const rentExp = await prisma.expenseCategory.create({
    data: { name: "Rent", description: "Shop rent" },
  });
  const utilitiesExp = await prisma.expenseCategory.create({
    data: { name: "Utilities", description: "Electricity, water" },
  });
  const salariesExp = await prisma.expenseCategory.create({
    data: { name: "Salaries", description: "Employee salaries" },
  });
  const suppliesExp = await prisma.expenseCategory.create({
    data: { name: "Supplies", description: "Shop supplies" },
  });
  const maintenanceExp = await prisma.expenseCategory.create({
    data: { name: "Maintenance", description: "Equipment maintenance" },
  });
  const marketingExp = await prisma.expenseCategory.create({
    data: { name: "Marketing", description: "Advertising" },
  });
  const transportExp = await prisma.expenseCategory.create({
    data: { name: "Transport", description: "Delivery costs" },
  });
  console.log("✅ Created expense categories");

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: "JWB-750",
        barcode: "5000267123456",
        name: "Johnnie Walker Black 750ml",
        categoryId: whiskeyCat.id,
        costPrice: 2500,
        sellingPrice: 3200,
        currentStock: 24,
        reorderLevel: 10,
      },
    }),
    prisma.product.create({
      data: {
        sku: "JWR-750",
        barcode: "5000267123457",
        name: "Johnnie Walker Red 750ml",
        categoryId: whiskeyCat.id,
        costPrice: 1500,
        sellingPrice: 2000,
        currentStock: 36,
        reorderLevel: 15,
      },
    }),
    prisma.product.create({
      data: {
        sku: "JWBL-750",
        barcode: "5000267123458",
        name: "Johnnie Walker Blue 750ml",
        categoryId: whiskeyCat.id,
        costPrice: 18000,
        sellingPrice: 25000,
        currentStock: 6,
        reorderLevel: 5,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CHV-750",
        barcode: "3057840001234",
        name: "Chivas Regal 12yr 750ml",
        categoryId: whiskeyCat.id,
        costPrice: 3500,
        sellingPrice: 4500,
        currentStock: 18,
        reorderLevel: 8,
      },
    }),
    prisma.product.create({
      data: {
        sku: "ABS-750",
        barcode: "8228680123456",
        name: "Absolut Vodka 750ml",
        categoryId: vodkaCat.id,
        costPrice: 1800,
        sellingPrice: 2400,
        currentStock: 30,
        reorderLevel: 12,
      },
    }),
    prisma.product.create({
      data: {
        sku: "SMI-750",
        barcode: "5000307123456",
        name: "Smirnoff Vodka 750ml",
        categoryId: vodkaCat.id,
        costPrice: 1200,
        sellingPrice: 1600,
        currentStock: 48,
        reorderLevel: 20,
      },
    }),
    prisma.product.create({
      data: {
        sku: "GRE-750",
        barcode: "8228680123457",
        name: "Grey Goose Vodka 750ml",
        categoryId: vodkaCat.id,
        costPrice: 4500,
        sellingPrice: 6000,
        currentStock: 12,
        reorderLevel: 6,
      },
    }),
    prisma.product.create({
      data: {
        sku: "BAC-750",
        barcode: "721059000123",
        name: "Bacardi White Rum 750ml",
        categoryId: rumCat.id,
        costPrice: 1400,
        sellingPrice: 1900,
        currentStock: 28,
        reorderLevel: 12,
      },
    }),
    prisma.product.create({
      data: {
        sku: "CAP-750",
        barcode: "721059000124",
        name: "Captain Morgan 750ml",
        categoryId: rumCat.id,
        costPrice: 1600,
        sellingPrice: 2200,
        currentStock: 22,
        reorderLevel: 10,
      },
    }),
    prisma.product.create({
      data: {
        sku: "GOR-750",
        barcode: "5000181123456",
        name: "Gordons Gin 750ml",
        categoryId: ginCat.id,
        costPrice: 1300,
        sellingPrice: 1800,
        currentStock: 35,
        reorderLevel: 15,
      },
    }),
    prisma.product.create({
      data: {
        sku: "TAN-750",
        barcode: "5000181123457",
        name: "Tangueray Gin 750ml",
        categoryId: ginCat.id,
        costPrice: 2200,
        sellingPrice: 3000,
        currentStock: 20,
        reorderLevel: 10,
      },
    }),
    prisma.product.create({
      data: {
        sku: "TUS-500",
        barcode: "6251211123456",
        name: "Tusker Lager 500ml",
        categoryId: beerCat.id,
        costPrice: 150,
        sellingPrice: 220,
        currentStock: 120,
        reorderLevel: 48,
      },
    }),
    prisma.product.create({
      data: {
        sku: "TUS-MAL-500",
        barcode: "6251211123457",
        name: "Tusker Malt 500ml",
        categoryId: beerCat.id,
        costPrice: 180,
        sellingPrice: 250,
        currentStock: 96,
        reorderLevel: 36,
      },
    }),
    prisma.product.create({
      data: {
        sku: "GUIN-500",
        barcode: "5000111123456",
        name: "Guinness 500ml",
        categoryId: beerCat.id,
        costPrice: 200,
        sellingPrice: 280,
        currentStock: 72,
        reorderLevel: 36,
      },
    }),
    prisma.product.create({
      data: {
        sku: "HEIN-330",
        barcode: "8712000123456",
        name: "Heineken 330ml",
        categoryId: beerCat.id,
        costPrice: 220,
        sellingPrice: 300,
        currentStock: 60,
        reorderLevel: 24,
      },
    }),
    prisma.product.create({
      data: {
        sku: "WHITE-750",
        barcode: "6001234123456",
        name: "Four Cousins 750ml",
        categoryId: wineCat.id,
        costPrice: 800,
        sellingPrice: 1200,
        currentStock: 24,
        reorderLevel: 12,
      },
    }),
    prisma.product.create({
      data: {
        sku: "DROP-750",
        barcode: "6001235123456",
        name: "Drostdy Hof 750ml",
        categoryId: wineCat.id,
        costPrice: 650,
        sellingPrice: 950,
        currentStock: 30,
        reorderLevel: 12,
      },
    }),
    prisma.product.create({
      data: {
        sku: "NED-750",
        barcode: "6001236123456",
        name: "Nederburg 750ml",
        categoryId: wineCat.id,
        costPrice: 900,
        sellingPrice: 1350,
        currentStock: 18,
        reorderLevel: 8,
      },
    }),
    prisma.product.create({
      data: {
        sku: "BAI-750",
        barcode: "8228680123458",
        name: "Baileys 750ml",
        categoryId: liqueurCat.id,
        costPrice: 2800,
        sellingPrice: 3800,
        currentStock: 15,
        reorderLevel: 8,
      },
    }),
    prisma.product.create({
      data: {
        sku: "KAH-750",
        barcode: "7501045001234",
        name: "Kahlua 750ml",
        categoryId: liqueurCat.id,
        costPrice: 2200,
        sellingPrice: 3000,
        currentStock: 12,
        reorderLevel: 6,
      },
    }),
    prisma.product.create({
      data: {
        sku: "MAR-700",
        barcode: "8001580123456",
        name: "Martell VS 700ml",
        categoryId: brandyCat.id,
        costPrice: 4500,
        sellingPrice: 6000,
        currentStock: 10,
        reorderLevel: 5,
      },
    }),
    prisma.product.create({
      data: {
        sku: "REM-700",
        barcode: "8001580123457",
        name: "Remy Martin VSOP 700ml",
        categoryId: brandyCat.id,
        costPrice: 6500,
        sellingPrice: 8500,
        currentStock: 8,
        reorderLevel: 4,
      },
    }),
  ]);
  console.log("✅ Created products");

  const productMap = Object.fromEntries(products.map((p) => [p.sku, p]));

  // Create stock movements for initial inventory
  for (const product of products) {
    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: StockMovementType.PURCHASE,
        quantity: product.currentStock,
        reason: "Initial inventory",
        userId: owner.id,
        unitCost: product.costPrice,
      },
    });
  }
  console.log("✅ Created initial stock movements");

  // Create sales for the past 7 days (reduced to 5 sales per day for speed)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableSkus = Object.keys(productMap);
  const paymentMethods: PaymentMethod[] = [
    PaymentMethod.CASH,
    PaymentMethod.CASH,
    PaymentMethod.CASH,
    PaymentMethod.MPESA,
    PaymentMethod.MPESA,
    PaymentMethod.CARD,
  ];
  const sellers = [seller1.id, seller2.id];

  let receiptCounter = 1000;

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const saleDate = new Date(today);
    saleDate.setDate(saleDate.getDate() - dayOffset);

    for (let i = 0; i < 5; i++) {
      const hour = Math.floor(Math.random() * 10) + 9;
      const minute = Math.floor(Math.random() * 60);
      const saleTime = new Date(saleDate);
      saleTime.setHours(hour, minute, 0, 0);

      const numItems = Math.floor(Math.random() * 3) + 1;
      const items: Array<{ product: (typeof products)[0]; quantity: number }> =
        [];

      for (let j = 0; j < numItems; j++) {
        const randomProduct =
          products[Math.floor(Math.random() * products.length)];
        const existingItem = items.find(
          (item) => item.product.id === randomProduct.id,
        );
        if (existingItem) {
          existingItem.quantity += Math.floor(Math.random() * 2) + 1;
        } else {
          items.push({
            product: randomProduct,
            quantity: Math.floor(Math.random() * 3) + 1,
          });
        }
      }

      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.product.sellingPrice,
        0,
      );
      const totalCost = items.reduce(
        (sum, item) => sum + item.quantity * item.product.costPrice,
        0,
      );
      const paymentMethod =
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const userId = sellers[Math.floor(Math.random() * sellers.length)];

      const sale = await prisma.sale.create({
        data: {
          receiptNumber: `RCP-${receiptCounter++}`,
          userId,
          subtotal,
          total: subtotal,
          paymentMethod,
          totalCost,
          grossProfit: subtotal - totalCost,
          createdAt: saleTime,
          items: {
            create: items.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              quantity: item.quantity,
              unitPrice: item.product.sellingPrice,
              unitCost: item.product.costPrice,
              subtotal: item.quantity * item.product.sellingPrice,
              createdAt: saleTime,
            })),
          },
        },
      });

      for (const item of items) {
        await prisma.stockMovement.create({
          data: {
            productId: item.product.id,
            type: StockMovementType.SALE,
            quantity: -item.quantity,
            reason: `Sale ${sale.receiptNumber}`,
            referenceId: sale.id,
            userId,
            unitCost: item.product.costPrice,
            createdAt: saleTime,
          },
        });
      }
    }
  }
  console.log("✅ Created sales with items");

  // Create expenses
  const expenseDate = new Date(today);
  expenseDate.setDate(expenseDate.getDate() - 3);

  await prisma.expense.create({
    data: {
      categoryId: rentExp.id,
      amount: 85000,
      description: "Monthly shop rent",
      paymentMethod: PaymentMethod.CASH,
      status: ExpenseStatus.APPROVED,
      submittedBy: seller1.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: utilitiesExp.id,
      amount: 12500,
      description: "Kenya Power electricity bill",
      paymentMethod: PaymentMethod.CASH,
      status: ExpenseStatus.APPROVED,
      submittedBy: seller1.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: utilitiesExp.id,
      amount: 3500,
      description: "Water bill",
      paymentMethod: PaymentMethod.CASH,
      status: ExpenseStatus.APPROVED,
      submittedBy: seller2.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: utilitiesExp.id,
      amount: 4500,
      description: "Internet subscription",
      paymentMethod: PaymentMethod.MPESA,
      status: ExpenseStatus.APPROVED,
      submittedBy: seller1.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: salariesExp.id,
      amount: 35000,
      description: "Staff salaries - December",
      paymentMethod: PaymentMethod.MPESA,
      status: ExpenseStatus.APPROVED,
      submittedBy: owner.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: suppliesExp.id,
      amount: 2800,
      description: "Shopping bags and receipt paper",
      paymentMethod: PaymentMethod.CASH,
      status: ExpenseStatus.APPROVED,
      submittedBy: seller2.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: maintenanceExp.id,
      amount: 5500,
      description: "AC repair and servicing",
      paymentMethod: PaymentMethod.CASH,
      status: ExpenseStatus.APPROVED,
      submittedBy: seller1.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: transportExp.id,
      amount: 4200,
      description: "Delivery charges for stock",
      paymentMethod: PaymentMethod.CASH,
      status: ExpenseStatus.APPROVED,
      submittedBy: seller2.id,
      approvedBy: owner.id,
      approvedAt: expenseDate,
      createdAt: expenseDate,
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: marketingExp.id,
      amount: 8000,
      description: "Social media advertising",
      paymentMethod: PaymentMethod.MPESA,
      status: ExpenseStatus.PENDING,
      submittedBy: seller1.id,
      createdAt: new Date(),
    },
  });
  await prisma.expense.create({
    data: {
      categoryId: suppliesExp.id,
      amount: 1500,
      description: "Cleaning supplies",
      paymentMethod: PaymentMethod.CASH,
      status: ExpenseStatus.PENDING,
      submittedBy: seller2.id,
      createdAt: new Date(),
    },
  });
  console.log("✅ Created expenses");

  // Create settings
  await prisma.setting.createMany({
    data: [
      {
        key: "shop_name",
        value: "Liquor Store",
        description: "Shop name for receipts",
      },
      {
        key: "shop_address",
        value: "123 Moi Avenue, Nairobi",
        description: "Shop address",
      },
      {
        key: "shop_phone",
        value: "+254 700 123 456",
        description: "Shop phone number",
      },
      {
        key: "receipt_footer",
        value: "Thank you for your business! Please drink responsibly.",
        description: "Receipt footer message",
      },
      { key: "tax_rate", value: "16", description: "VAT rate percentage" },
    ],
  });
  console.log("✅ Created settings");

  console.log("🎉 Seed completed successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("  Owner: owner@lsms.com / owner123");
  console.log("  Seller 1: seller@lsms.com / seller123");
  console.log("  Seller 2: seller2@lsms.com / seller123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
