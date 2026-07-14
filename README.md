# MATTE. 

> A premium, cinematic e-commerce experience built for the modern web.

MATTE. is a high-end, dark-themed e-commerce platform built with Next.js. It features a brutalist yet elegant design system, emphasizing full-bleed photography, confident typography, and a deliberate, layered sense of depth.

---

## ✦ Features

- **Cinematic Dark Theme**: A meticulously crafted matte charcoal and deep black design system with subtle glassmorphism and frosted layers.
- **Dynamic Interactions**: Fluid micro-animations powered by `framer-motion`, providing a tactile, premium feel to every interaction.
- **Editorial Layouts**: Magazine-style product showcases, staggered grids, and immersive scrolling experiences.
- **Seamless Authentication**: Custom login and registration flows built with Next-Auth, featuring custom styled inputs, auto-fill fixes, and smooth transition states.
- **Modern Tech Stack**: Built on the cutting edge with Next.js 16, Tailwind CSS v4, and Prisma ORM.

---

## ✦ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (v16.2)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Authentication:** [Next-Auth](https://next-auth.js.org/)
- **Database / ORM:** [Prisma](https://www.prisma.io/)

---

## ✦ Getting Started

### Prerequisites

Ensure you have Node.js 20+ installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/matte-shop.git
   cd matte-shop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   Configure your database URL in the `.env` file, then push the schema:
   ```bash
   npx prisma db push
   npm run db:seed # If a seed script is configured
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✦ Design System Principles

- **Typography**: Clean, geometric sans-serif fonts used confidently with large weights for headers and muted, highly-legible secondary text.
- **Colors**: Strictly matte. Avoid glossy or bright neon elements. The primary palette consists of `#121212`, `#1a1a1a`, with strategic use of `#8ed500` (electric lime) as a high-contrast accent.
- **Rhythm**: Pacing is everything. Allow elements to breathe with ample whitespace, staggered entrance animations, and overlapping z-index layers.

---

## ✦ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
