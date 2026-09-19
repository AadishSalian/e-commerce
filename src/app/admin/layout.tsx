import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tighter">MATTE. Admin</h2>
          <p className="text-sm text-muted-foreground mt-1">Catalog Management</p>
        </div>
        
        <nav className="flex flex-col gap-2">
          <Link href="/admin/products" className="px-4 py-2 hover:bg-muted rounded-md transition-colors font-medium">
            Products
          </Link>
          <Link href="/admin/categories" className="px-4 py-2 hover:bg-muted rounded-md transition-colors text-muted-foreground">
            Categories
          </Link>
          <Link href="/admin/orders" className="px-4 py-2 hover:bg-muted rounded-md transition-colors text-muted-foreground">
            Orders
          </Link>
        </nav>
        
        <div className="mt-auto pt-6 border-t border-border">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            &larr; Back to Store
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
