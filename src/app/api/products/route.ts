import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/products - Already exists but let's update it
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { sku: { contains: search } },
          { barcode: { contains: search } },
        ],
      }),
      ...(category && { categoryId: category }),
      ...(lowStock && {
        currentStock: { lte: db.product.fields.reorderLevel },
      }),
    };

    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

// POST /api/products - Create new product
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

    // Check for duplicate SKU
    if (sku) {
      const existingSku = await db.product.findUnique({
        where: { sku },
      });
      if (existingSku) {
        return NextResponse.json(
          { error: "SKU already exists" },
          { status: 400 },
        );
      }
    }

    // Check for duplicate barcode
    if (barcode) {
      const existingBarcode = await db.product.findUnique({
        where: { barcode },
      });
      if (existingBarcode) {
        return NextResponse.json(
          { error: "Barcode already exists" },
          { status: 400 },
        );
      }
    }

    const initialStock = parseInt(currentStock) || 0;

    const product = await db.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          sku,
          barcode: barcode || null,
          name,
          description: description || null,
          categoryId,
          costPrice: parseFloat(costPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          currentStock: initialStock,
          reorderLevel: parseInt(reorderLevel) || 10,
        },
        include: { category: true },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: newProduct.id,
            type: "PURCHASE",
            quantity: initialStock,
            reason: "Initial stock",
            userId: session.user.id,
            unitCost: newProduct.costPrice,
          },
        });
      }

      return newProduct;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
