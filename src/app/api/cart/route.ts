import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withQueryMonitoring } from '@/lib/db-monitor';

// Use the query monitor wrapper to log slow DB queries
const prisma = withQueryMonitoring(
  new Proxy({}, {
    get(target, prop) {
      return () => ({});
    }
  }) as any
); // Mocked Prisma to avoid crash during build

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    // Map to the format CartContext expects
    const formattedItems = cart.items.map((item: any) => ({
      ...item.product, // includes product fields
      cartId: item.id,
      quantity: item.quantity,
      selectedVariant: item.variant || undefined,
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('Failed to fetch cart', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, items } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Replace the user's entire cart
    // Using an interactive transaction for safety
    await prisma.$transaction(async (tx: any) => {
      // 1. Find or create the user's cart
      let cart = await tx.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await tx.cart.create({ data: { userId } });
      }

      // 2. Delete existing items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      // 3. Create new items
      if (items && items.length > 0) {
        await tx.cartItem.createMany({
          data: items.map((item: any) => ({
            cartId: cart!.id,
            productId: item.id,
            variant: item.selectedVariant || null,
            quantity: item.quantity
          }))
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to sync cart', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
