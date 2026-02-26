import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      sku,
      barcode,
      name,
      description,
      categoryId,
      costPrice,
      sellingPrice,
      currentStock,
      reorderLevel,
    } = body;

    // Check for duplicate SKU/barcode (excluding current product)
    if (sku) {
      const existingSku = await db.product.findFirst({
        where: { sku, NOT: { id } },
      });
      if (existingSku) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 },
        );
      }
    }

    if (barcode) {
      const existingBarcode = await db.product.findFirst({
        where: { barcode, NOT: { id } },
      });
      if (existingBarcode) {
        return NextResponse.json(
          { error: "Barcode already exists" },
          { status: 400 },
        );
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        sku,
        barcode,
        name,
        description,
        categoryId,
        costPrice: parseFloat(costPrice),
        sellingPrice: parseFloat(sellingPrice),
        reorderLevel: parseInt(reorderLevel),
      },
      include: { category: true },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 },
    );
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete by setting isActive to false
    await db.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
