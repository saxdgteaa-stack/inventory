import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { ExpenseStatus } from "@prisma/client";

// GET /api/reports - Get comprehensive reports data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Get sales data
    const sales = await db.sale.findMany({
      where: {
        isVoided: false,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        items: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get expenses data
    const expenses = await db.expense.findMany({
      where: {
        status: ExpenseStatus.APPROVED,
        ...(Object.keys(dateFilter).length > 0 && { approvedAt: dateFilter }),
      },
      include: {
        category: true,
      },
    });

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCOGS = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
    const grossProfit = sales.reduce((sum, sale) => sum + sale.grossProfit, 0);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const netProfit = grossProfit - totalExpenses;

    // Payment method breakdown
    const paymentBreakdown = {
      cash: sales
        .filter((s) => s.paymentMethod === "CASH")
        .reduce((sum, s) => sum + s.total, 0),
      mpesa: sales
        .filter((s) => s.paymentMethod === "MPESA")
        .reduce((sum, s) => sum + s.total, 0),
      card: sales
        .filter((s) => s.paymentMethod === "CARD")
        .reduce((sum, s) => sum + s.total, 0),
    };

    // Top selling products
    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.subtotal;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Daily sales chart data
    const dailySales: Record<
      string,
      { date: string; sales: number; profit: number }
    > = {};
    sales.forEach((sale) => {
      const date = sale.createdAt.toISOString().split("T")[0];
      if (!dailySales[date]) {
        dailySales[date] = { date, sales: 0, profit: 0 };
      }
      dailySales[date].sales += sale.total;
      dailySales[date].profit += sale.grossProfit;
    });

    const chartData = Object.values(dailySales).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Expense breakdown by category
    const expenseBreakdown: Record<string, number> = {};
    expenses.forEach((expense) => {
      const category = expense.category.name;
      expenseBreakdown[category] =
        (expenseBreakdown[category] || 0) + expense.amount;
    });

    return NextResponse.json({
      summary: {
        totalSales,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        salesCount: sales.length,
        avgSaleValue: sales.length > 0 ? totalSales / sales.length : 0,
      },
      paymentBreakdown,
      topProducts,
      chartData,
      expenseBreakdown,
      sales: sales.slice(0, 50), // Last 50 sales
      expenses: expenses.slice(0, 50), // Last 50 expenses
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 },
    );
  }
}
