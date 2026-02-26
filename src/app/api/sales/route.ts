import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { PaymentMethod } from '@prisma/client';

// GET /api/sales - Get sales list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where = {
      isVoided: false,
      ...(startDate && {
        createdAt: { gte: new Date(startDate) },
      }),
      ...(endDate && {
        createdAt: { lte: new Date(endDate) },
      }),
    };

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          user: { select: { name: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({ sales, total, page, limit });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sale
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, paymentMethod, paymentReference, discount } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in sale' },
        { status: 400 }
      );
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Generate receipt number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const todaySalesCount = await db.sale.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lte: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });
    const receiptNumber = `RCP-${dateStr}-${(todaySalesCount + 1).toString().padStart(4, '0')}`;

    // Validate and get product details
    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Some products not found or inactive' },
        { status: 400 }
      );
    }

    // Check stock availability and calculate totals
    let subtotal = 0;
    let totalCost = 0;
    const saleItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }

      if (product.currentStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}` },
          { status: 400 }
        );
      }

      const itemSubtotal = product.sellingPrice * item.quantity;
      subtotal += itemSubtotal;
      totalCost += product.costPrice * item.quantity;

      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        unitCost: product.costPrice,
        subtotal: itemSubtotal,
      });
    }

    const discountAmount = discount || 0;
    const total = subtotal - discountAmount;
    const grossProfit = total - totalCost;

    // Create sale and update stock in a transaction
    const sale = await db.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          receiptNumber,
          userId: session.user.id,
          subtotal,
          discount: discountAmount,
          total,
          paymentMethod,
          paymentReference,
          totalCost,
          grossProfit,
          items: {
            create: saleItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update stock and create stock movements
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: { decrement: item.quantity },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            reason: `Sale ${receiptNumber}`,
            referenceId: newSale.id,
            userId: session.user.id,
            unitCost: product.costPrice,
          },
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}
