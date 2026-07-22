# Software Requirements Specification (SRS)
## Cattle Parking & Gate Management System (CattleHaven)

### 1. Introduction
#### 1.1 Purpose
This document provides a comprehensive Software Requirements Specification (SRS) for the Cattle Parking & Gate Management System (CattleHaven). It outlines both functional and non-functional requirements, technical specifications, and use cases to serve as a complete reference guide for administrators, operators, and developers.

#### 1.2 System Overview
CattleHaven is a full-stack, responsive web application designed to digitize and optimize gate check-ins, parking records, and financial transactions for cattle holding yards. It manages the arrival (parking) and release (checkout) of cattle (oxen), tracks outstanding receivables, supports dynamic payment channel registration, and provides advanced analytical reports.

#### 1.3 Key Objectives
- **Modern Digitization:** Replace manual logbooks with an automated digital register.
- **Financial Precision:** Support exact billing calculations in Ethiopian Birr (ETB), split-payment tracking, and unpaid balance management.
- **Offline-First Resilience:** Ensure ultra-fast loading speeds and support complete offline-ready viewing of dashboards and reports using client-side caching.
- **Administrative Flexibility:** Empower owners to configure dynamic payment methods on the fly without changing source code.

---

### 2. User Roles & Use Cases

#### 2.1 User Roles
1. **System Administrator / Yard Owner:** Possesses full privileges, including user management, setting system rates, registering/deleting custom payment channels, viewing aggregated financial accounts, and exporting system-wide reports.
2. **Gate Operator:** Standard staff member responsible for registering incoming cattle, collecting initial payments, updating checkout records, and releasing cattle.

#### 2.2 Core Use Cases
- **UC-1: Authenticated Access (Login)**
  - *Actors:* Operator, Administrator
  - *Description:* Users authenticate securely using a unique username and password. The system issues a JSON Web Token (JWT) with secure local storage.
  
- **UC-2: Oxen Gate Entry (Check-In)**
  - *Actors:* Operator
  - *Description:* Registers incoming oxen under a customer. Captures the customer name, phone number, oxen count, gate rate per head (ETB), parking type (Day or Night shift), initial payment amount, and selected payment channel.
  
- **UC-3: Oxen Release & Exit (Checkout / Active Parking)**
  - *Actors:* Operator
  - *Description:* Operator selects an active parking record. The system calculates the outstanding balance. The operator records final/additional payments, selects the payment channel, or checks out with confirmed outstanding debt.
  
- **UC-4: Dynamic Payment Channel Configuration**
  - *Actors:* Administrator (Admin Portal)
  - *Description:* Admin adds custom payment methods (e.g., CBE, Telebirr, Awash Bank, specific bank accounts). These options dynamically propagate to all check-in, checkout, and settlement forms instantly.

- **UC-5: Settle Unpaid Receivables**
  - *Actors:* Operator, Administrator
  - *Description:* Allows operators to record additional payments on active or historical records with outstanding receivables, directly reducing the customer's balance and updating the respective payment channel's ledger.

---

### 3. Functional Requirements

#### 3.1 Gate Check-In Module
- **FR-1.1:** Must collect customer details (Full Name, Phone Number).
- **FR-1.2:** Must autocomplete existing customer details if the phone number already exists in the local database.
- **FR-1.3:** Must record number of oxen, gate rate per head, and shift type (Day/Night).
- **FR-1.4:** Must auto-calculate the Total Due ($ \text{Oxen Count} \times \text{Rate} $).
- **FR-1.5:** Must support recording initial payment received and auto-calculate the outstanding balance.
- **FR-1.6:** Must dynamically fetch active payment methods for selection.

#### 3.2 Active Parking & Checkout Module
- **FR-2.1:** Must show a live list of currently parked cattle with live search capability by customer name or phone.
- **FR-2.2:** Must prevent checkout of cattle with an outstanding balance unless the operator explicitly ticks the "Confirm Checkout with Outstanding Debt" override.
- **FR-2.3:** Must support adding additional payments upon checkout.

#### 3.3 Dynamic Payment Channels
- **FR-3.1:** Administrators must be able to add new custom payment channels with custom names (e.g., CBE Birr, Telebirr Merchant, Bank of Abyssinia) via the Admin Portal.
- **FR-3.2:** System must auto-generate unique codes for custom channels.
- **FR-3.3:** Standard dropdown inputs across Check-in, Checkout, and Settlement must automatically update based on the database state of these payment channels.

#### 3.4 Reports & Analytical Dashboard
- **FR-4.1:** The dashboard must display daily revenue, cash-on-hand, bank balances, and total outstanding receivables.
- **FR-4.2:** Reports must allow filtering records by:
  - Date Range (Today, Week, Month, Custom)
  - Payment Status (All, Receivables, Fully Paid)
  - Payment Method (Cash, CBE, Telebirr, custom methods)
  - Shift Type (Day, Night)
  - Parking Status (Active, Completed)
- **FR-4.3:** Reports must display a specialized account card showing the **exact all-time balance held** in any filtered payment method (e.g., selecting "CBE" displays the exact sum of money collected in the CBE account).
- **FR-4.4:** Must support exporting filtered reports to Microsoft Excel format (.xlsx) for external bookkeepers.

---

### 4. Non-Functional Requirements & Performance

#### 4.1 Speed & Offline Resilience (Offline-First Performance)
- **NFR-1.1 (Sub-millisecond State Delivery):** The system must utilize reactive state hooks (`useState`, `useEffect`) pre-loaded from client-side `localStorage` cache. Upon opening dashboards or reports, cached states must render instantly while a silent background fetch completes.
- **NFR-1.2 (Network Fault Tolerance):** In the event of a network dropout, the system must degrade gracefully, loading active parking list, report records, and dynamic payment methods directly from local cache without breaking the layout or showing infinite loading spinners.
- **NFR-1.3 (Zero-Flicker Layouts):** State updates must use layout-stabilized animations via `motion/react` to guarantee seamless transitions without page shifting.

#### 4.2 Security & Authentication
- **NFR-2.1 (JWT Authentication):** All API routes except login must be guarded by Bearer JWT tokens.
- **NFR-2.2 (Database Integrity):** The backend must run database transactions or relational queries to ensure account balances, record states, and payment channels remain strictly synchronized.

#### 4.3 UI/UX Elegance
- **NFR-3.1 (Aesthetic Theme):** Balanced contrast with optimized spacing, Inter typography, and subtle micro-interactions.
- **NFR-3.2 (Adaptive Layout):** Tailored responsive breakpoints (`sm:`, `md:`, `lg:`) to fit desktop administrative screens as well as operator tablets or smartphones.

---

### 5. Technical Architecture

- **Frontend:** React 18 with TypeScript, Vite (HMR-free safe build), Tailwind CSS for full utility styling, Lucide React icons, and Motion (`motion/react`) for layout transitions.
- **Backend:** Node.js, Express, TypeScript runtime, JSON Web Token (JWT) authentication, and Prisma ORM.
- **Database:** SQLite local instance (`prisma/dev.db`) for high-speed, local low-latency relational queries.

---

### 6. Relational Database Schema

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  password  String
  role      String   // ADMIN or OPERATOR
}

model Customer {
  id        String          @id @default(uuid())
  fullName  String
  phone     String          @unique
  records   ParkingRecord[]
}

model ParkingRecord {
  id             String    @id @default(uuid())
  customerId     String
  customer       Customer  @relation(fields: [customerId], references: [id])
  cattleCount    Int
  pricePerCattle Float
  totalAmount    Float
  amountPaid     Float
  balanceDue     Float
  parkingType    String    // DAY or NIGHT
  status         String    // PARKED or COMPLETED
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  paymentMethod  String    // Dynamic code (e.g. CASH, CBE, TELEBIRR)
  isFullyPaid    Boolean   @default(false)
}

model PaymentMethod {
  id        String   @id @default(uuid())
  name      String   @unique
  code      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
}
```
