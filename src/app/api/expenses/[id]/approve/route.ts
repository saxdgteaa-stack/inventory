import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { ExpenseStatus } from "@prisma/client";

// POST /api/expenses/[id]/approve - Approve or reject expense
export async function POST(
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
    const { action, rejectionReason } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const expense = await db.expense.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.status !== ExpenseStatus.PENDING) {
      return NextResponse.json(
        { error: "Expense already processed" },
        { status: 400 },
      );
    }

    const newStatus =
      action === "approve" ? ExpenseStatus.APPROVED : ExpenseStatus.REJECTED;

    const updatedExpense = await db.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id },
        data: {
          status: newStatus,
          approvedBy: session.user.id,
          approvedAt: new Date(),
          rejectionReason: action === "reject" ? rejectionReason : null,
        },
        include: {
          category: true,
          submitter: { select: { name: true } },
          approver: { select: { name: true } },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: action === "approve" ? "EXPENSE_APPROVE" : "EXPENSE_REJECT",
          entityType: "Expense",
          entityId: id,
          description: `${action === "approve" ? "Approved" : "Rejected"} expense: ${expense.description} (KES ${expense.amount})`,
          oldValue: JSON.stringify({ status: "PENDING" }),
          newValue: JSON.stringify({ status: newStatus }),
        },
      });

      return updated;
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Error processing expense:", error);
    return NextResponse.json(
      { error: "Failed to process expense" },
      { status: 500 },
    );
  }
}
