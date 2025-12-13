# Project Overview

This is a Next.js project written in TypeScript, serving as a full-stack application. It leverages a modern web development stack to provide a robust and scalable platform.

**Key Technologies and Features:**

*   **Next.js:** A React framework for building full-stack web applications, enabling server-side rendering, static site generation, and API routes.
*   **TypeScript:** Provides type safety and enhances code quality and maintainability.
*   **NextAuth.js:** Handles authentication, supporting various providers and secure session management.
*   **Prisma:** An ORM (Object-Relational Mapper) for database interaction, providing a type-safe and intuitive way to query and manage data.
*   **Tailwind CSS:** A utility-first CSS framework for rapidly building custom designs.
*   **GSAP (GreenSock Animation Platform):** A powerful JavaScript animation library for creating high-performance animations.
*   **React Hook Form & Zod:** Used for efficient form handling and validation, ensuring data integrity.
*   **API Routes:** The project includes a comprehensive set of API routes under the `app/api` directory, supporting various functionalities such as authentication, event management, and user operations.

# Building and Running

To set up and run this project locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Development Server:**
    To run the project in development mode with hot-reloading:
    ```bash
    npm run dev
    ```
    The application will typically be accessible at `http://localhost:3000`.

3.  **Build for Production:**
    To create an optimized production build of the application:
    ```bash
    npm run build
    ```

4.  **Start Production Server:**
    After building, you can start the production server:
    ```bash
    npm run start
    ```

5.  **Linting:**
    To check code quality and adherence to style guidelines:
    ```bash
    npm run lint
    ```

# Development Conventions

*   **TypeScript:** All new code should be written in TypeScript to ensure type safety and improve developer experience.
*   **ESLint:** The project uses ESLint with `eslint-config-next` to maintain code consistency and catch potential issues.
*   **Next.js Architecture:** Follow Next.js conventions for file-based routing, API routes, and data fetching strategies.
*   **Tailwind CSS:** Utilize Tailwind CSS classes for styling components. Custom styles should extend Tailwind's configuration where necessary, rather than using raw CSS.
*   **Prisma Schema:** Any changes to the database schema should be reflected in `prisma/schema.prisma` and migrated accordingly.

