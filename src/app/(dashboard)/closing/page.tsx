'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarCheck,
  AlertTriangle,
  Check,
  Loader2,
  DollarSign,
  Banknote,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClosingData {
  expected: {
    cash: number;
    mpesa: number;
    card: number;
    total: number;
  };
  salesCount: number;
  existingClosing: {
    id: string;
    date: string;
    declaredCash: number;
    expectedCash: number;
    cashVariance: number;
    status: string;
    notes: string | null;
    user: { name: string };
  } | null;
  recentClosings: Array<{
    id: string;
    date: string;
    declaredCash: number;
    expectedCash: number;
    cashVariance: number;
    status: string;
    user: { name: string };
  }>;
}

export default function ClosingPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [data, setData] = useState<ClosingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Form state
  const [declaredCash, setDeclaredCash] = useState('');
  const [declaredMpesa, setDeclaredMpesa] = useState('');
  const [declaredCard, setDeclaredCard] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchClosingData();
  }, []);

  const fetchClosingData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/closing');
      if (!res.ok) throw new Error('Failed to fetch closing data');
      const closingData = await res.json();
      setData(closingData);

      // Pre-fill expected amounts
      setDeclaredMpesa(closingData.expected.mpesa.toString());
      setDeclaredCard(closingData.expected.card.toString());
    } catch (error) {
      console.error('Error fetching closing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load closing data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitClosing = async () => {
    if (!declaredCash) {
      toast({
        title: 'Error',
        description: 'Please enter the declared cash amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          declaredCash: parseFloat(declaredCash),
          declaredMpesa: declaredMpesa ? parseFloat(declaredMpesa) : null,
          declaredCard: declaredCard ? parseFloat(declaredCard) : null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit closing');
      }

      toast({
        title: 'Success',
        description: 'Daily closing submitted successfully',
      });
      setShowConfirmDialog(false);
      fetchClosingData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit closing',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  const variance = data && declaredCash
    ? parseFloat(declaredCash) - data.expected.cash
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Closing</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {data?.existingClosing ? (
        // Already closed
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className={cn(
                'p-3 rounded-full mb-4',
                data.existingClosing.status === 'APPROVED'
                  ? 'bg-green-500/10'
                  : 'bg-amber-500/10'
              )}>
                {data.existingClosing.status === 'APPROVED' ? (
                  <Check className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Today&apos;s Closing Already Submitted
              </h2>
              <p className="text-muted-foreground mb-4">
                Submitted by {data.existingClosing.user.name}
              </p>

              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Expected Cash</p>
                  <p className="font-semibold">{formatPrice(data.existingClosing.expectedCash)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Declared Cash</p>
                  <p className="font-semibold">{formatPrice(data.existingClosing.declaredCash)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Variance</p>
                  <p className={cn(
                    'font-semibold',
                    data.existingClosing.cashVariance === 0
                      ? 'text-green-500'
                      : data.existingClosing.cashVariance > 0
                      ? 'text-blue-500'
                      : 'text-red-500'
                  )}>
                    {data.existingClosing.cashVariance >= 0 ? '+' : ''}
                    {formatPrice(data.existingClosing.cashVariance)}
                  </p>
                </div>
              </div>

              <Badge
                className={cn(
                  'mt-4',
                  data.existingClosing.status === 'APPROVED'
                    ? 'bg-green-500'
                    : 'bg-amber-500'
                )}
              >
                {data.existingClosing.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Closing form
        <>
          {/* Expected amounts */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Cash</p>
                    <p className="text-2xl font-bold">{formatPrice(data?.expected.cash || 0)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected M-Pesa</p>
                    <p className="text-2xl font-bold">{formatPrice(data?.expected.mpesa || 0)}</p>
                  </div>
                  <Smartphone className="h-8 w-8 text-purple-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Card</p>
                    <p className="text-2xl font-bold">{formatPrice(data?.expected.card || 0)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Closing form */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                Submit Closing
              </CardTitle>
              <CardDescription>
                Enter the actual counted amounts from the register
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="declaredCash">Cash in Register *</Label>
                  <Input
                    id="declaredCash"
                    type="number"
                    placeholder="Count cash..."
                    value={declaredCash}
                    onChange={(e) => setDeclaredCash(e.target.value)}
                  />
                  {declaredCash && data && (
                    <p className={cn(
                      'text-xs',
                      variance === 0
                        ? 'text-green-500'
                        : variance > 0
                        ? 'text-blue-500'
                        : 'text-red-500'
                    )}>
                      Variance: {variance >= 0 ? '+' : ''}{formatPrice(variance)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="declaredMpesa">M-Pesa Total</Label>
                  <Input
                    id="declaredMpesa"
                    type="number"
                    placeholder="From statement..."
                    value={declaredMpesa}
                    onChange={(e) => setDeclaredMpesa(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="declaredCard">Card Total</Label>
                  <Input
                    id="declaredCard"
                    type="number"
                    placeholder="From terminal..."
                    value={declaredCard}
                    onChange={(e) => setDeclaredCard(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about today's closing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!declaredCash}
                >
                  Submit Closing
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Recent closings */}
      {data?.recentClosings && data.recentClosings.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Recent Closings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Declared</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentClosings.map((closing) => (
                  <TableRow key={closing.id}>
                    <TableCell>
                      {new Date(closing.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{closing.user.name}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(closing.expectedCash)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(closing.declaredCash)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-medium',
                        closing.cashVariance === 0
                          ? 'text-green-500'
                          : closing.cashVariance > 0
                          ? 'text-blue-500'
                          : 'text-red-500'
                      )}
                    >
                      {closing.cashVariance >= 0 ? '+' : ''}
                      {formatPrice(closing.cashVariance)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          closing.status === 'APPROVED'
                            ? 'bg-green-500'
                            : 'bg-amber-500'
                        )}
                      >
                        {closing.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Closing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit today&apos;s closing?
              {variance !== 0 && (
                <div className="mt-2 p-2 bg-amber-500/10 rounded text-amber-500 text-sm">
                  Note: There is a variance of {variance >= 0 ? '+' : ''}{formatPrice(variance)}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
              onClick={submitClosing}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
