'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  BarChart3,
  PieChart,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportData {
  summary: {
    totalSales: number;
    totalCOGS: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    salesCount: number;
    avgSaleValue: number;
  };
  paymentBreakdown: {
    cash: number;
    mpesa: number;
    card: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  chartData: Array<{
    date: string;
    sales: number;
    profit: number;
  }>;
  expenseBreakdown: Record<string, number>;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    // Redirect non-owners
    if (session && session.user.role !== 'OWNER') {
      router.push('/');
      return;
    }

    if (session?.user.role === 'OWNER') {
      fetchReports();
    }
  }, [session, dateRange]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      const today = new Date();

      switch (dateRange) {
        case 'today':
          params.set('startDate', today.toISOString().split('T')[0]);
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          params.set('startDate', weekAgo.toISOString().split('T')[0]);
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          params.set('startDate', monthAgo.toISOString().split('T')[0]);
          break;
      }

      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error('Failed to fetch reports');

      setData(await res.json());
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  if (!session || session.user.role !== 'OWNER') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Financial analysis and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {(['today', 'week', 'month', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(range)}
                className={cn(
                  dateRange === range && 'bg-amber-500 text-zinc-900 hover:bg-amber-600'
                )}
              >
                {range === 'today' ? 'Today' : 
                 range === 'week' ? '7 Days' :
                 range === 'month' ? '30 Days' : 'All Time'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">{formatPrice(data.summary.totalSales)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.summary.salesCount} transactions
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Profit</p>
                    <p className="text-2xl font-bold text-green-500">
                      {formatPrice(data.summary.grossProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.summary.totalSales > 0
                        ? ((data.summary.grossProfit / data.summary.totalSales) * 100).toFixed(1)
                        : 0}% margin
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {formatPrice(data.summary.totalExpenses)}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-orange-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={cn(
                      'text-2xl font-bold',
                      data.summary.netProfit >= 0 ? 'text-green-500' : 'text-red-500'
                    )}>
                      {formatPrice(data.summary.netProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      After expenses
                    </p>
                  </div>
                  {data.summary.netProfit >= 0 ? (
                    <TrendingUp className="h-8 w-8 text-green-500/50" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-500/50" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sales Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Trend
                </CardTitle>
                <CardDescription>Daily sales and profit</CardDescription>
              </CardHeader>
              <CardContent>
                {data.chartData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-end gap-2 h-48">
                      {data.chartData.slice(-7).map((day, index) => {
                        const maxSales = Math.max(...data.chartData.map(d => d.sales));
                        const height = maxSales > 0 ? (day.sales / maxSales) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-zinc-800 rounded-t relative" style={{ height: `${Math.max(height, 5)}%` }}>
                              <div
                                className="absolute bottom-0 w-full bg-amber-500 rounded-t"
                                style={{ height: '100%' }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Cash</span>
                    </div>
                    <span className="font-medium">{formatPrice(data.paymentBreakdown.cash)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span>M-Pesa</span>
                    </div>
                    <span className="font-medium">{formatPrice(data.paymentBreakdown.mpesa)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Card</span>
                    </div>
                    <span className="font-medium">{formatPrice(data.paymentBreakdown.card)}</span>
                  </div>
                </div>

                {/* Visual bar */}
                <div className="mt-6">
                  <div className="flex h-4 rounded-full overflow-hidden">
                    {data.paymentBreakdown.cash > 0 && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${(data.paymentBreakdown.cash / data.summary.totalSales) * 100}%` }}
                      />
                    )}
                    {data.paymentBreakdown.mpesa > 0 && (
                      <div
                        className="bg-purple-500"
                        style={{ width: `${(data.paymentBreakdown.mpesa / data.summary.totalSales) * 100}%` }}
                      />
                    )}
                    {data.paymentBreakdown.card > 0 && (
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(data.paymentBreakdown.card / data.summary.totalSales) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Best performers by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {data.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {data.topProducts.slice(0, 5).map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.quantity} units sold
                            </p>
                          </div>
                        </div>
                        <span className="font-medium text-amber-500">
                          {formatPrice(product.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No sales data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(data.expenseBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.expenseBreakdown)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm">{category}</span>
                          <span className="font-medium text-orange-500">
                            {formatPrice(amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No expense data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No data available
        </div>
      )}
    </div>
  );
}
