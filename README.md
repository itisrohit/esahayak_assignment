# Esahayak Assignment

A responsive buyer management application built with Next.js 14, TypeScript, and Tailwind CSS. This application features a modern UI with CRUD operations for managing buyer leads, simulated authentication flow, and responsive design that works on all device sizes.

## Features

- **Authentication Flow**: Email-based magic link authentication (simulated)
- **Buyer Management**: Create, view, edit, and list buyer leads
- **Search & Filtering**: Full-text search and filter capabilities
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Modern UI**: Clean, intuitive interface with card-based layouts
- **Form Validation**: Client-side validation for all forms
- **History Tracking**: View change history for buyer records
- **Export Functionality**: Export buyer history as CSV

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React 19](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/) components

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- pnpm (package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/itisrohit/esahayak_assignment
   ```

2. Navigate to the project directory:
   ```bash
   cd esahayak_assignment
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

### Running the Application

#### Development Mode

To run the application in development mode:

```bash
pnpm dev
```

The application will be available at http://localhost:3000

#### Production Mode

To build and run the application in production mode:

1. Build the application:
   ```bash
   pnpm build
   ```

2. Start the production server:
   ```bash
   pnpm start
   ```

The application will be available at http://localhost:3000

### Available Scripts

- `pnpm dev` - Runs the app in development mode
- `pnpm build` - Builds the app for production
- `pnpm start` - Runs the built app in production mode
- `pnpm lint` - Runs ESLint to check for linting errors

## Application Structure

- **Login Page**: `/login` - Email-based authentication with magic link
- **Buyers List**: `/authenticated/buyers` - View and search all buyers
- **Add New Buyer**: `/authenticated/buyers/new` - Create a new buyer lead
- **Buyer Detail**: `/authenticated/buyers/[id]` - View and edit buyer details

## Authentication

The application uses a simulated authentication flow:
1. Enter your email on the login page
2. A magic link is "sent" to your email (simulated)
3. You'll be redirected to the buyers list page automatically

For demo purposes, any email will work - no actual email is sent.

## Development

The application uses:
- Mock data for demonstration purposes
- Client-side state management
- Responsive design with Tailwind CSS
- Type-safe components with TypeScript
