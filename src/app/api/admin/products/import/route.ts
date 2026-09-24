import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    
    // Parse CSV
    const { data, errors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Automatically convert numbers
    });

    if (errors.length > 0) {
      return NextResponse.json({ error: 'Failed to parse CSV', details: errors }, { status: 400 });
    }

    // Since Prisma is mocked, we simulate persistence by appending to mockData.ts directly.
    
    // Attempt to locate mockData.ts
    const mockDataPath = path.join(process.cwd(), 'src', 'lib', 'mockData.ts');
    
    if (fs.existsSync(mockDataPath)) {
      let content = fs.readFileSync(mockDataPath, 'utf8');
      
      let newProductsStr = '';
      for (const row of data as any[]) {
        if (!row.name || !row.price) continue;
        
        const isNew = String(row.isNew).toLowerCase() === 'true';
        const price = parseFloat(row.price) || 0;
        const stockCount = parseInt(row.stockCount, 10) || 15;
        const id = row.id || `imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        newProductsStr += `
  {
    id: '${id.replace(/'/g, "\\'")}',
    name: '${String(row.name).replace(/'/g, "\\'")}',
    description: '${String(row.description || '').replace(/'/g, "\\'")}',
    price: ${price},
    category: '${String(row.category || 'Uncategorized').replace(/'/g, "\\'")}',
    isNew: ${isNew},
    image: '${String(row.image || '').replace(/'/g, "\\'")}',
    stockCount: ${stockCount}
  },`;
      }
      
      if (newProductsStr) {
        content = content.replace(
          /export const MOCK_PRODUCTS: Product\[\] = \[/,
          `export const MOCK_PRODUCTS: Product[] = [${newProductsStr}`
        );
        fs.writeFileSync(mockDataPath, content);
      }
    }
    
    console.log(`Successfully imported ${data.length} products to mockData.ts`);

    return NextResponse.json({ success: true, count: data.length });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
