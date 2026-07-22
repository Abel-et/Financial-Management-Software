export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  createdAt: string;
}

export interface ParkingRecord {
  id: string;
  customerId: number;
  customer: Customer;
  cattleCount: number;
  pricePerCattle: number;
  parkingType: "DAY" | "NIGHT" | "BOTH";
  status: "PARKED" | "COMPLETED";
  entryTime: string;
  exitTime?: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: string;
  isFullyPaid: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  allTimeBalance?: number;
}

export interface User {
  id: number;
  username: string;
  role: "ADMIN";
}

export interface DashboardStats {
  activeCattleCount: number;
  todayRevenue: {
    cash: number;
    bank: number;
    total: number;
  };
  totalReceivables: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  recordedBy: string;
}

