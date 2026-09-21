import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export async function GET() {
  try {
    // Format data for CSV directly from MOCK_PRODUCTS
    const csvData = MOCK_PRODUCTS.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      stockCount: p.stockCount ?? 15,
      category: p.category,
      isNew: p.isNew ? 'true' : 'false',
      image: p.image
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
