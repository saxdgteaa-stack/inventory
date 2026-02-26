import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { StockMovementType } from "@prisma/client";

// POST /api/inventory/adjust - Adjust stock
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { productId, type, quantity, reason } = body;

    if (!productId || !quantity || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!Object.values(StockMovementType).includes(type as StockMovementType)) {
      return NextResponse.json(
        { error: "Invalid stock movement type" },
        { status: 400 },
      );
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const adjustmentQuantity = parseInt(quantity);
    const newStock = product.currentStock + adjustmentQuantity;

    if (newStock < 0) {
      return NextResponse.json(
        { error: "Insufficient stock for this adjustment" },
        { status: 400 },
      );
    }

    // Use transaction to update stock and create movement
    const result = await db.$transaction(async (tx) => {
      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // Create stock movement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          type: type as StockMovementType,
          quantity: adjustmentQuantity,
          reason,
          userId: session.user.id,
          unitCost: product.costPrice,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "STOCK_ADJUSTMENT",
          entityType: "Product",
          entityId: productId,
          description: `Adjusted stock for ${product.name} by ${adjustmentQuantity}. Reason: ${reason}`,
          oldValue: JSON.stringify({ stock: product.currentStock }),
          newValue: JSON.stringify({ stock: newStock }),
        },
      });

      return { product: updatedProduct, movement };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 },
    );
  }
}
