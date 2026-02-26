# AGENTS.md - Coding Agent Guidelines

This document provides guidelines for AI coding agents working in this codebase.

## Project Overview

**LSMS (Liquor Store Management System)** - A Next.js 16 application with App Router, TypeScript, Tailwind CSS 4, Prisma ORM, and shadcn/ui components.

**Package Manager**: Bun (use `bun` instead of `npm`)

## Build/Lint/Test Commands

```bash
# Development
bun run dev              # Start dev server on port 3000

# Build & Production
bun run build            # Build for production (copies static files)
bun run start            # Start production server

# Linting
bun run lint             # Run ESLint on entire codebase

# Database (Prisma)
bun run db:push          # Push schema changes without migration
bun run db:generate      # Generate Prisma client
bun run db:migrate       # Create and run migrations
bun run db:reset         # Reset database with seed

# Testing
# No test framework configured. When tests are added, use:
# bun test                # Run all tests
# bun test <file>         # Run single test file
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group (login)
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/
│   ├── layout/            # Layout components (sidebar, top-bar)
│   ├── providers/         # Context providers
│   └── ui/                # shadcn/ui components
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities and configurations
    ├── auth.ts            # NextAuth configuration
    ├── auth-utils.ts      # Auth helper functions
    ├── db.ts              # Prisma client singleton
    └── utils.ts           # General utilities (cn function)
prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Database seeding
```

## Code Style Guidelines

### Imports

Order imports as follows (blank line between groups):
1. React/Next.js imports
2. Third-party libraries
3. Internal imports using `@/` alias
4. Relative imports

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
```

### Path Aliases

Always use `@/` alias for imports from `src/`:

```typescript
// Correct
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';

// Incorrect
import { Button } from '../../../components/ui/button';
```

### TypeScript

- Strict mode enabled but `noImplicitAny: false`
- Prefer explicit types for function parameters and return values
- Use Zod for runtime validation schemas
- Type API responses and database models explicitly

```typescript
interface ProductForm {
  name: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
}

export async function createProduct(data: ProductForm): Promise<Product> {
  // ...
}
```

### React Components

- Use function components with named exports
- Mark client components with `'use client'` at top of file
- Use PascalCase for component names
- Use `cn()` for conditional class names

```typescript
'use client';

interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  children: React.ReactNode;
}

export function Button({ variant = 'default', children }: ButtonProps) {
  return (
    <button className={cn(
      'base-styles',
      variant === 'destructive' && 'destructive-styles'
    )}>
      {children}
    </button>
  );
}
```

### API Routes (App Router)

- Use named exports for HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
- Always authenticate with `getServerSession(authOptions)`
- Return `NextResponse.json()` with appropriate status codes
- Handle errors with try-catch

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await db.product.findMany();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Database (Prisma)

- Import Prisma client from `@/lib/db` (singleton pattern)
- Use transactions for operations affecting multiple tables
- Stock changes MUST go through `StockMovement` model (never edit stock directly)

```typescript
import { db } from '@/lib/db';

// Creating with related stock movement
const product = await db.$transaction(async (tx) => {
  const newProduct = await tx.product.create({ data: productData });
  
  if (initialStock > 0) {
    await tx.stockMovement.create({
      data: {
        productId: newProduct.id,
        type: 'PURCHASE',
        quantity: initialStock,
        userId: session.user.id,
      },
    });
  }
  
  return newProduct;
});
```

### Authentication & Authorization

- Check session for all protected routes
- Role-based access: `OWNER` has full access, `SELLER` has limited access
- Session includes: `id`, `email`, `name`, `role`

```typescript
const session = await getServerSession(authOptions);

if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

if (session.user.role !== 'OWNER') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Error Handling

- Use try-catch in async functions
- Log errors with `console.error()`
- Return user-friendly error messages
- Use Zod for input validation

```typescript
try {
  const validatedData = schema.parse(body);
  // ... process data
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.errors },
      { status: 400 }
    );
  }
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

### Styling

- Use Tailwind CSS classes
- Use `cn()` utility for conditional/merged classes
- shadcn/ui components use CSS variables for theming
- Dark mode is default (class-based)

```typescript
<div className={cn(
  'flex items-center gap-2',
  isActive && 'bg-accent text-accent-foreground',
  isDisabled && 'opacity-50 pointer-events-none'
)}>
```

### Forms

- Use `react-hook-form` with `@hookform/resolvers/zod`
- Define Zod schemas for validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  costPrice: z.number().positive(),
  sellingPrice: z.number().positive(),
});

type ProductForm = z.infer<typeof productSchema>;

const form = useForm<ProductForm>({
  resolver: zodResolver(productSchema),
  defaultValues: { name: '', sku: '', costPrice: 0, sellingPrice: 0 },
});
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductList`, `SaleItem` |
| Functions | camelCase | `getProducts`, `createSale` |
| Variables | camelCase | `productCount`, `totalAmount` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Files (components) | kebab-case | `product-list.tsx` |
| Files (utilities) | kebab-case | `auth-utils.ts` |
| API routes | lowercase | `route.ts` |
| Database models | PascalCase | `Product`, `StockMovement` |

## Key Business Rules

1. **Stock Management**: Stock is NEVER edited directly. All changes go through `StockMovement` records (PURCHASE, SALE, ADJUSTMENT, RETURN, VOID_SALE).

2. **User Roles**:
   - `OWNER`: Full access to all features
   - `SELLER`: POS, inventory view, daily closing

3. **Payment Methods**: CASH, MPESA, CARD

4. **Expense Workflow**: PENDING → APPROVED/REJECTED (OWNER approval required)

## Before Committing

1. Run `bun run lint` to check for issues
2. Ensure TypeScript compiles without errors
3. Test authentication flows work correctly
4. Verify database operations with transactions where appropriate
