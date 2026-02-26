import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { PaymentMethod, ExpenseStatus } from "@prisma/client";

// GET /api/expenses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const isOwner = session.user.role === "OWNER";

    const where = {
      // Sellers can only see their own expenses
      ...(!isOwner && { submittedBy: session.user.id }),
      ...(status && { status: status as ExpenseStatus }),
      ...(startDate && {
        createdAt: { gte: new Date(startDate) },
      }),
      ...(endDate && {
        createdAt: { lte: new Date(endDate) },
      }),
    };

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: {
          category: true,
          submitter: { select: { name: true } },
          approver: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    return NextResponse.json({ expenses, total, page, limit });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, amount, description, paymentMethod, receiptImage } =
      body;

    if (!categoryId || !amount || !description || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (
      !Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)
    ) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    const expense = await db.expense.create({
      data: {
        categoryId,
        amount: parseFloat(amount),
        description,
        paymentMethod: paymentMethod as PaymentMethod,
        receiptImage: receiptImage || null,
        submittedBy: session.user.id,
        status: ExpenseStatus.PENDING,
      },
      include: {
        category: true,
        submitter: { select: { name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}
