import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET() {
  try {
    // In a real app:
    // const products = await prisma.product.findMany({ include: { category: true } });
    
    // Mock data
    const products = [
      { id: '1', name: 'Matte Black Backpack', price: 129.99, stock: 45, category: 'Accessories' },
      { id: '2', name: 'Minimalist Desk Mat', price: 49.99, stock: 5, category: 'Office' },
      { id: '3', name: 'Charcoal Tumbler', price: 34.50, stock: 0, category: 'Home' },
    ];

    // Format data for CSV
    const csvData = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category
    }));

    const csv = Papa.unparse(csvData);

    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="products_export.csv"');

    return new NextResponse(csv, { status: 200, headers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
