# Family Tree Visualization Application

A web application designed to create, visualize, and manage family trees. It offers an interactive interface to explore family connections, view member details, and dynamically adjust the tree layout.

## Tech Stack Overview

This project is built with:

*   **Frontend Framework:** React
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Tailwind CSS & shadcn/ui
*   **Data Fetching & State Management:** TanStack Query (React Query)
*   **Diagramming Library:** React Flow (@xyflow/react)
*   **Backend (Database):** Supabase
*   **Notifications:** Sonner (toast notifications)
*   **Testing:** Vitest & React Testing Library

## Prerequisites

*   Node.js (v18 or later recommended)
*   Package manager:
    *   [Bun](https://bun.sh/) (recommended)
    *   OR [npm](https://www.npmjs.com/) (comes with Node.js)

## Environment Variables

This project requires Supabase credentials to connect to the database.

1.  Create a `.env` file in the root of the project directory.
2.  Add your Supabase project URL and Anon Key to this file.

**`.env` file template:**

```env
# Supabase Credentials
VITE_SUPABASE_URL="your_supabase_project_url_here"
VITE_SUPABASE_ANON_KEY="your_supabase_anon_key_here"
```

**Note:** The `.env` file is included in `.gitignore` and should not be committed to version control.

## Getting Started

Follow these steps to get the project up and running on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
    (Replace `<repository-url>` with the actual URL of this repository)

2.  **Navigate to the project directory:**
    ```bash
    cd <project-directory-name>
    ```

3.  **Install dependencies:**
    *   Using Bun (recommended):
        ```bash
        bun install
        ```
    *   Using npm:
        ```bash
        npm install
        ```

4.  **Set up environment variables:**
    *   Copy the `.env.example` file (if one exists) to `.env`, or create a new `.env` file as described in the "Environment Variables" section above.
    *   Fill in your Supabase credentials.

## Running the Application

### Development Mode

To start the development server with hot reloading:

*   Using Bun:
    ```bash
    bun run dev
    ```
*   Using npm:
    ```bash
    npm run dev
    ```

The application will typically be available at `http://localhost:5173` (this may vary depending on your Vite configuration or if the port is already in use).

### Production Build

To create an optimized production build:

*   Using Bun:
    ```bash
    bun run build
    ```
*   Using npm:
    ```bash
    npm run build
    ```
This command will generate a `dist` folder containing the static assets for deployment.

### Previewing Production Build (Optional)

Vite provides a command to serve the production build locally for preview purposes:

*   Using Bun:
    ```bash
    bun run preview
    ```
*   Using npm:
    ```bash
    npm run preview
    ```

## Running Tests

To execute the unit and component tests:

*   Using Bun:
    ```bash
    bun test
    ```
    To run tests in watch mode:
    ```bash
    bun test --watch
    ```
*   Using npm:
    ```bash
    npm test
    ```
    To run tests in watch mode (if configured in `package.json` scripts, often `npm run test:watch` or similar):
    ```bash
    npm run test -- --watch
    ```
    (The exact command for watch mode with npm might depend on the `test` script in `package.json`. `npm test -- --watch` is a common way to pass args to the underlying test runner.)

---

*This README provides a general guide. Refer to specific documentation for libraries like Vite, Supabase, and React Flow for more detailed information.*
