# Laundry Services Platform - Frontend Web Application

A modern, responsive React web application built with Vite and TailwindCSS for the Laundry Services Platform. Provides customer ordering, real-time M-Pesa payment tracking, provider order management, admin control panel, and customer support portal.

---

## 🛠️ Required Dependencies

### Core Dependencies (`dependencies`)
- **`react`** (`^19.2.8`) & **`react-dom`** (`^19.2.8`): UI rendering engine.
- **`react-router-dom`** (`^7.18.2`): Declarative routing and single-page navigation.
- **`axios`** (`^1.19.0`): HTTP client for interacting with backend REST endpoints.
- **`react-hook-form`** (`^7.85.0`): Form management, input validation, and state handling.
- **`react-hot-toast`** (`^2.6.0`): Lightweight notification toasts for payment updates and alerts.
- **`react-icons`** (`^5.7.0`): Popular SVG icon sets (Feather, FontAwesome, Heroicons).
- **`tailwindcss`** (`^4.3.3`) & **`@tailwindcss/vite`** (`^4.3.3`): Utility-first CSS framework integrated via Vite.

### Development Dependencies (`devDependencies`)
- **`vite`** (`^8.2.0`): High-performance frontend build tool and dev server.
- **`@vitejs/plugin-react`** (`^6.0.4`): Official React plugin for Vite.
- **`oxlint`** (`^1.75.0`): High-speed JavaScript/JSX linter.
- **`@types/react`** & **`@types/react-dom`**: TypeScript definitions for React components.

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)

### 2. Installation Steps
```bash
# Navigate to frontend directory
cd frontend

# Install all required npm dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root of the `frontend/` directory if connecting to a custom backend URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Running the Application

- **Development Mode**:
  ```bash
  npm run dev
  ```
  App will start locally at `http://localhost:5173` (or the port specified in terminal).

- **Production Build**:
  ```bash
  npm run build
  ```

- **Preview Production Build**:
  ```bash
  npm run preview
  ```

- **Lint Codebase**:
  ```bash
  npm run lint
  ```

---

## 📂 Architecture & Code Structure

```
frontend/
├── src/
│   ├── api/                 # Axios API request clients (paymentApi, orderApi, serviceApi, etc.)
│   ├── assets/              # Static assets, logos, and images
│   ├── components/          # Reusable UI components (Navbar, Footer, Modals, Forms)
│   ├── context/             # React Context Providers (AuthContext, SettingsContext)
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page components & views
│   ├── utils/               # Formatting helper utilities
│   ├── App.jsx              # Main routing component
│   ├── main.jsx             # React DOM root entry point
│   └── index.css            # Global CSS styles & Tailwind imports
└── package.json             # Frontend dependencies and scripts
```

### Key Modules & Logic Explanation

1. **Routing & Authentication (`src/App.jsx`, `src/context/AuthContext.jsx`)**
   - Implements protected routes based on user role (`customer`, `provider`, `admin`).
   - `AuthContext` maintains active user state, JWT tokens, login/logout actions.

2. **Checkout & M-Pesa Payment (`src/pages/CheckoutPage.jsx`, `src/api/paymentApi.js`)**
   - Enables customers to review laundry items, input M-Pesa phone number, and trigger STK push.
   - Includes real-time polling logic (`pollPaymentStatus`) to automatically detect when the user confirms their PIN on mobile.

3. **Provider Portal (`src/pages/ProviderPortal.jsx`, `src/pages/ProviderOrders.jsx`, `src/pages/ProviderServices.jsx`)**
   - Dedicated workspace for laundry service providers to manage incoming orders, service pricing, and active fulfillment.

4. **Admin Management Panel (`src/pages/AdminPortal.jsx`, `src/pages/AdminOrderManagement.jsx`, `src/pages/AdminPaymentRecords.jsx`, `src/pages/AdminSystemSettings.jsx`)**
   - Comprehensive dashboard for administrators to view revenue analytics, manage payment records, configure system settings, and inspect support tickets.

5. **Customer Support Tickets (`src/pages/PortalGateway.jsx`, `src/api/ticketApi.js`)**
   - Interactive support ticket system for issue tracking and communication between customers and admins.
