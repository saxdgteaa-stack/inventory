import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { DailyClosingStatus } from '@prisma/client';

// GET /api/closing - Get daily closing data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Get today's sales by payment method
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await db.sale.findMany({
      where: {
        isVoided: false,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const expectedCash = sales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.total, 0);
    const expectedMpesa = sales
      .filter((s) => s.paymentMethod === 'MPESA')
      .reduce((sum, s) => sum + s.total, 0);
    const expectedCard = sales
      .filter((s) => s.paymentMethod === 'CARD')
      .reduce((sum, s) => sum + s.total, 0);
    const expectedTotal = expectedCash + expectedMpesa + expectedCard;

    // Check if closing already exists for today
    const existingClosing = await db.dailyClosing.findUnique({
      where: { date: startOfDay },
      include: {
        user: { select: { name: true } },
      },
    });

    // Get recent closings
    const recentClosings = await db.dailyClosing.findMany({
      take: 7,
      orderBy: { date: 'desc' },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({
      expected: {
        cash: expectedCash,
        mpesa: expectedMpesa,
        card: expectedCard,
        total: expectedTotal,
      },
      salesCount: sales.length,
      existingClosing,
      recentClosings,
    });
  } catch (error) {
    console.error('Error fetching closing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch closing data' },
      { status: 500 }
    );
  }
}

// POST /api/closing - Submit daily closing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, declaredCash, declaredMpesa, declaredCard, notes } = body;

    if (!date || declaredCash === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const closingDate = new Date(date);
    closingDate.setHours(0, 0, 0, 0);

    // Check if already closed
    const existing = await db.dailyClosing.findUnique({
      where: { date: closingDate },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Closing already submitted for this date' },
        { status: 400 }
      );
    }

    // Calculate expected amounts
    const startOfDay = new Date(closingDate);
    const endOfDay = new Date(closingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await db.sale.findMany({
      where: {
        isVoided: false,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const expectedCash = sales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.total, 0);

    const cashVariance = declaredCash - expectedCash;
    const status = Math.abs(cashVariance) < 100 
      ? DailyClosingStatus.APPROVED 
      : DailyClosingStatus.DISCREPANCY;

    const closing = await db.dailyClosing.create({
      data: {
        date: closingDate,
        userId: session.user.id,
        expectedCash,
        expectedMpesa: sales.filter((s) => s.paymentMethod === 'MPESA').reduce((sum, s) => sum + s.total, 0),
        expectedCard: sales.filter((s) => s.paymentMethod === 'CARD').reduce((sum, s) => sum + s.total, 0),
        expectedTotal: sales.reduce((sum, s) => sum + s.total, 0),
        declaredCash,
        declaredMpesa: declaredMpesa || null,
        declaredCard: declaredCard || null,
        cashVariance,
        totalVariance: cashVariance,
        status,
        notes: notes || null,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DAILY_CLOSING',
        entityType: 'DailyClosing',
        entityId: closing.id,
        description: `Daily closing submitted for ${date}. Cash variance: KES ${cashVariance}`,
        newValue: JSON.stringify({
          declaredCash,
          expectedCash,
          variance: cashVariance,
        }),
      },
    });

    return NextResponse.json(closing, { status: 201 });
  } catch (error) {
    console.error('Error creating closing:', error);
    return NextResponse.json(
      { error: 'Failed to submit closing' },
      { status: 500 }
    );
  }
}
