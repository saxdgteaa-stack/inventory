"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  todaySales: number;
  todaySalesCount: number;
  todaySalesChange: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  expenses?: number;
  pendingExpenses: number;
  netProfit?: number;
  lowStockCount: number;
  totalProducts: number;
  paymentBreakdown: {
    cash: number;
    mpesa: number;
    card: number;
  };
  recentSales: Array<{
    id: string;
    amount: number;
    items: number;
    time: string;
    paymentMethod: string;
  }>;
  lowStockProducts: Array<{
    name: string;
    stock: number;
    reorderLevel: number;
  }>;
  weeklySales?: Array<{
    day: string;
    date: string;
    sales: number;
    profit: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section - Compact on mobile */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Hi, {session?.user?.name?.split(" ")[0] || "User"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        {!isOwner && (
          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-zinc-900 w-full xs:w-auto"
          >
            <Link href="/pos">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Open POS
            </Link>
          </Button>
        )}
      </div>

      {/* Key Metrics - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 md:pb-2 md:pt-4 md:px-4">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Today&apos;s Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-3 px-3 md:pb-4 md:px-4">
            <div className="text-lg md:text-2xl font-bold text-foreground">
              KES {data.todaySales.toLocaleString()}
            </div>
            <div className="flex items-center text-xs mt-0.5">
              {data.todaySalesChange >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" />+
                  {data.todaySalesChange}%
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownRight className="h-3 w-3 mr-0.5" />
                  {data.todaySalesChange}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {isOwner && data.grossProfit !== undefined && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 md:pb-2 md:pt-4 md:px-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Gross Profit
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3 md:pb-4 md:px-4">
              <div className="text-lg md:text-2xl font-bold text-foreground">
                KES {data.grossProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {data.grossProfitMargin}% margin
              </div>
            </CardContent>
          </Card>
        )}

        {isOwner && data.expenses !== undefined && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 md:pb-2 md:pt-4 md:px-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Expenses
              </CardTitle>
              <Receipt className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3 md:pb-4 md:px-4">
              <div className="text-lg md:text-2xl font-bold text-foreground">
                KES {data.expenses.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {data.pendingExpenses} pending
              </div>
            </CardContent>
          </Card>
        )}

        {isOwner && data.netProfit !== undefined && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 md:pb-2 md:pt-4 md:px-4">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Net Profit
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="pb-3 px-3 md:pb-4 md:px-4">
              <div className="text-lg md:text-2xl font-bold text-foreground">
                KES {data.netProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                After expenses
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-3 md:pb-2 md:pt-4 md:px-4">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Low Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-3 px-3 md:pb-4 md:px-4">
            <div className="text-lg md:text-2xl font-bold text-foreground">
              {data.lowStockCount}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              of {data.totalProducts} products
            </div>
          </CardContent>
        </Card>

        {!isOwner && (
          <Card className="bg-card border-border col-span-2">
            <CardContent className="flex gap-2 pt-4 pb-3 px-3">
              <Button size="sm" variant="outline" asChild className="flex-1">
                <Link href="/expenses">Add Expense</Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="flex-1">
                <Link href="/closing">Daily Closing</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment, Sales, Stock - Stack on mobile */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Payment Breakdown - Compact on mobile */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base text-foreground">
              Payments
            </CardTitle>
            <CardDescription className="text-xs">
              Today&apos;s breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-green-500/10">
                  <Banknote className="h-3.5 w-3.5 text-green-500" />
                </div>
                <span className="text-sm">Cash</span>
              </div>
              <span className="font-medium text-sm">
                KES {data.paymentBreakdown.cash.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-500/10">
                  <Smartphone className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <span className="text-sm">M-Pesa</span>
              </div>
              <span className="font-medium text-sm">
                KES {data.paymentBreakdown.mpesa.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-blue-500/10">
                  <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <span className="text-sm">Card</span>
              </div>
              <span className="font-medium text-sm">
                KES {data.paymentBreakdown.card.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-4">
            <div>
              <CardTitle className="text-sm md:text-base text-foreground">
                Recent Sales
              </CardTitle>
              <CardDescription className="text-xs">
                Latest transactions
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/reports">View</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentSales.length > 0 ? (
                data.recentSales.slice(0, 4).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{sale.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.items} items • {sale.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        KES {sale.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {sale.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sales today</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 md:pb-4">
            <div>
              <CardTitle className="text-sm md:text-base text-foreground">
                Low Stock
              </CardTitle>
              <CardDescription className="text-xs">
                Below reorder level
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href="/inventory">View</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.lowStockProducts.length > 0 ? (
                data.lowStockProducts.slice(0, 4).map((product, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate max-w-[140px]">
                        {product.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product.stock}/{product.reorderLevel}
                      </span>
                    </div>
                    <Progress
                      value={(product.stock / product.reorderLevel) * 100}
                      className="h-1"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  All stocked well
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Chart - Owner Only */}
      {isOwner && data.weeklySales && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-sm md:text-base text-foreground">
              Weekly Sales
            </CardTitle>
            <CardDescription className="text-xs">Past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 md:gap-2 h-32 md:h-48">
              {data.weeklySales.map((day, index) => {
                const maxSales = Math.max(
                  ...data.weeklySales!.map((d) => d.sales),
                  1,
                );
                const height = (day.sales / maxSales) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-1 md:gap-2"
                  >
                    <div
                      className="w-full bg-zinc-800 rounded-t relative"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="absolute bottom-0 w-full bg-amber-500 rounded-t transition-all"
                        style={{ height: "100%" }}
                      />
                    </div>
                    <span className="text-[10px] md:text-xs text-muted-foreground">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
