import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Clean existing data
  await prisma.variant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // Seed Categories
  const techCategory = await prisma.category.create({
    data: {
      name: 'Tech',
      slug: 'tech',
    },
  })

  const accCategory = await prisma.category.create({
    data: {
      name: 'Accessories',
      slug: 'accessories',
    },
  })

  const objCategory = await prisma.category.create({
    data: {
      name: 'Objects',
      slug: 'objects',
    },
  })

  // Seed Products
  const products = [
    {
      name: 'Matte Keyboard 1',
      description: 'An ultra-low profile mechanical keyboard machined from a single block of aerospace-grade aluminum. Finished in a soft-touch matte charcoal.',
      price: 249.0,
      stock: 50,
      images: ['/images/products/keyboard.jpg'],
      categoryId: techCategory.id,
      variants: {
        create: [
          { name: 'Color', value: 'Matte Black', stock: 25 },
          { name: 'Color', value: 'Graphite', stock: 25 },
        ]
      }
    },
    {
      name: 'Ceramic Earbuds',
      description: 'High-fidelity wireless audio encased in a durable, matte-finished ceramic housing. Designed for pristine sound and minimal presence.',
      price: 199.0,
      stock: 120,
      images: ['/images/products/earbuds.jpg'],
      categoryId: techCategory.id,
      variants: {
        create: [
          { name: 'Color', value: 'Charcoal', stock: 60 },
          { name: 'Color', value: 'Sage', stock: 60 },
        ]
      }
    },
    {
      name: 'Structured Backpack',
      description: 'A minimalist carry solution crafted from weather-resistant matte ballistic nylon. Features padded compartments for all your devices.',
      price: 159.0,
      stock: 30,
      images: ['/images/products/backpack.jpg'],
      categoryId: accCategory.id,
    },
    {
      name: 'Desk Pad',
      description: 'A premium vegan leather desk mat that absorbs sound and provides a smooth, non-reflective surface for your workspace.',
      price: 49.0,
      stock: 200,
      images: ['/images/products/desk-pad.jpg'],
      categoryId: objCategory.id,
    },
    {
      name: 'Aluminum Monitor Stand',
      description: 'Elevate your display with this seamless aluminum unibody stand. Designed to match the matte aesthetic of your premium devices.',
      price: 89.0,
      stock: 75,
      images: ['/images/products/stand.jpg'],
      categoryId: accCategory.id,
    }
  ]

  for (const p of products) {
    const product = await prisma.product.create({
      data: p
    })
    console.log(`Created product: ${product.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
