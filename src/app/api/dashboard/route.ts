import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { ExpenseStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isOwner = session.user.role === "OWNER";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's sales
    const todaySales = await db.sale.aggregate({
      where: {
        isVoided: false,
        createdAt: { gte: today },
      },
      _sum: {
        total: true,
        grossProfit: true,
      },
      _count: true,
    });

    // Yesterday's sales for comparison
    const yesterdaySales = await db.sale.aggregate({
      where: {
        isVoided: false,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      _sum: {
        total: true,
      },
    });

    const todayTotal = todaySales._sum.total || 0;
    const yesterdayTotal = yesterdaySales._sum.total || 0;
    const salesChange =
      yesterdayTotal > 0
        ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100
        : 0;

    // Payment breakdown for today
    const [cashSales, mpesaSales, cardSales] = await Promise.all([
      db.sale.aggregate({
        where: {
          isVoided: false,
          createdAt: { gte: today },
          paymentMethod: "CASH",
        },
        _sum: { total: true },
      }),
      db.sale.aggregate({
        where: {
          isVoided: false,
          createdAt: { gte: today },
          paymentMethod: "MPESA",
        },
        _sum: { total: true },
      }),
      db.sale.aggregate({
        where: {
          isVoided: false,
          createdAt: { gte: today },
          paymentMethod: "CARD",
        },
        _sum: { total: true },
      }),
    ]);

    // Today's expenses (approved)
    const todayExpenses = await db.expense.aggregate({
      where: {
        status: ExpenseStatus.APPROVED,
        createdAt: { gte: today },
      },
      _sum: {
        amount: true,
      },
    });

    // Pending expenses count
    const pendingExpenses = await db.expense.count({
      where: { status: ExpenseStatus.PENDING },
    });

    // Low stock products
    const products = await db.product.findMany({
      where: { isActive: true },
      select: {
        name: true,
        currentStock: true,
        reorderLevel: true,
      },
    });

    const lowStockProducts = products
      .filter((p) => p.currentStock <= p.reorderLevel)
      .map((p) => ({
        name: p.name,
        stock: p.currentStock,
        reorderLevel: p.reorderLevel,
      }));

    // Recent sales
    const recentSales = await db.sale.findMany({
      where: { isVoided: false },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        receiptNumber: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        items: {
          select: { quantity: true },
        },
      },
    });

    // Weekly sales chart data
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);

    const weeklySalesRaw = await db.sale.findMany({
      where: {
        isVoided: false,
        createdAt: { gte: weekAgo },
      },
      select: {
        total: true,
        grossProfit: true,
        createdAt: true,
      },
    });

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklySalesMap = new Map<string, { sales: number; profit: number }>();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayKey = date.toISOString().split("T")[0];
      const dayName = dayNames[date.getDay()];
      weeklySalesMap.set(dayKey, { sales: 0, profit: 0 });
    }

    weeklySalesRaw.forEach((sale) => {
      const dayKey = sale.createdAt.toISOString().split("T")[0];
      const existing = weeklySalesMap.get(dayKey);
      if (existing) {
        existing.sales += sale.total;
        existing.profit += sale.grossProfit;
      }
    });

    const weeklySales = Array.from(weeklySalesMap.entries()).map(
      ([key, value]) => {
        const date = new Date(key);
        return {
          day: dayNames[date.getDay()],
          date: key,
          ...value,
        };
      },
    );

    // Total products count
    const totalProducts = await db.product.count({
      where: { isActive: true },
    });

    const response = {
      todaySales: todayTotal,
      todaySalesCount: todaySales._count,
      todaySalesChange: Math.round(salesChange * 10) / 10,
      grossProfit: todaySales._sum.grossProfit || 0,
      grossProfitMargin:
        todayTotal > 0
          ? Math.round(
              ((todaySales._sum.grossProfit || 0) / todayTotal) * 100 * 10,
            ) / 10
          : 0,
      expenses: todayExpenses._sum.amount || 0,
      pendingExpenses,
      netProfit:
        (todaySales._sum.grossProfit || 0) - (todayExpenses._sum.amount || 0),
      lowStockCount: lowStockProducts.length,
      totalProducts,
      paymentBreakdown: {
        cash: cashSales._sum.total || 0,
        mpesa: mpesaSales._sum.total || 0,
        card: cardSales._sum.total || 0,
      },
      recentSales: recentSales.map((sale) => ({
        id: sale.receiptNumber,
        amount: sale.total,
        items: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        time: sale.createdAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        paymentMethod: sale.paymentMethod,
      })),
      lowStockProducts: lowStockProducts.slice(0, 5),
      weeklySales,
    };

    // If not owner, hide financial data
    if (!isOwner) {
      delete (response as Record<string, unknown>).grossProfit;
      delete (response as Record<string, unknown>).grossProfitMargin;
      delete (response as Record<string, unknown>).expenses;
      delete (response as Record<string, unknown>).netProfit;
      delete (response as Record<string, unknown>).weeklySales;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
