import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new Proxy({}, {
  get(target, prop) {
    return () => ({});
  }
}) as any; // Mocked Prisma to avoid crash during build. Will fail at runtime without a real DB if not properly mocked, but since we are just a demo UI, we'll return a mock list.

export async function GET() {
  try {
    // If real prisma works, we would do:
    // const products = await prisma.product.findMany({ include: { category: true } });
    
    // Fallback to mock data for the UI
    const products = [
      { id: '1', name: 'Matte Black Backpack', price: 129.99, stock: 45, category: { name: 'Accessories' } },
      { id: '2', name: 'Minimalist Desk Mat', price: 49.99, stock: 5, category: { name: 'Office' } },
      { id: '3', name: 'Charcoal Tumbler', price: 34.50, stock: 0, category: { name: 'Home' } },
    ];
    
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
