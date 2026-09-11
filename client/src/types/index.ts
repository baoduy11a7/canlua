export type UserRole = 'admin' | 'nhan_vien_can' | 'ke_toan' | 'chu_vua';

export interface User {
  _id?: string;
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Household {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  idCardNumber?: string;
  totalWeighedKg: number;
  totalPaidAmount: number;
  sessionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RiceType {
  _id: string;
  name: string;
  code: string;
  defaultPricePerKg: number;
  unit: string;
  description?: string;
  isActive: boolean;
}

export interface WarehouseLocation {
  _id: string;
  name: string;
  code: string;
  address?: string;
  managerName?: string;
  phone?: string;
  capacityKg?: number;
  note?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SessionStatus = 'open' | 'closed' | 'paid';

export interface GridColumn {
  colIndex: number;
  colLabel: string;
  rows: (number | null)[];
}

export interface NameChangeLog {
  from: string;
  to: string;
  changedByName?: string;
  changedAt: string;
  reason?: string;
}

export interface WeighingSession {
  _id: string;
  code: string;
  householdId: string;
  householdNameSnapshot: string;
  householdPhoneSnapshot?: string;
  householdAddressSnapshot?: string;
  riceTypeId: string;
  riceTypeNameSnapshot: string;
  warehouseId?: string;
  warehouseNameSnapshot?: string;
  pricePerKg: number;
  tareWeightPerBagKg: number;
  status: SessionStatus;
  columns: GridColumn[];
  grossWeightKg: number;
  tareTotalKg: number;
  totalWeightKg: number;
  totalWeighCount: number;
  totalAmount: number;
  note?: string;
  createdBy: string;
  createdByName?: string;
  weighDate: string;
  closedAt?: string;
  paidAt?: string;
  nameChangeLog: NameChangeLog[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseTransaction {
  _id: string;
  code: string;
  type: 'import' | 'export';
  warehouseId?: string;
  warehouseName?: string;
  riceTypeId: string;
  riceTypeName: string;
  quantityKg: number;
  unitPrice: number;
  totalAmount: number;
  relatedSessionId?: string;
  partnerName: string;
  partnerPhone?: string;
  note?: string;
  date: string;
  createdByName?: string;
  createdAt: string;
}

export interface InventoryItem {
  _id: string;
  riceTypeId: string | RiceType;
  riceTypeName: string;
  warehouseId?: string | WarehouseLocation;
  warehouseName?: string;
  currentQuantityKg: number;
  minWarningKg: number;
  maxWarningKg: number;
  lastUpdated: string;
}

export interface Expense {
  _id: string;
  code: string;
  category: string;
  categoryName: string;
  amount: number;
  note?: string;
  recipient?: string;
  date: string;
  createdByName?: string;
}

export interface DashboardSummary {
  filterRange?: string;
  startDate?: string;
  endDate?: string;
  today: {
    weighedKg: number;
    purchaseCost: number;
    sessionCount: number;
    revenue: number;
  };
  period?: {
    weighedKg: number;
    purchaseCost: number;
    sessionCount: number;
    revenue: number;
    exportKg: number;
    expenses: number;
    netProfit: number;
  };
  month: {
    weighedKg: number;
    purchaseCost: number;
    revenue: number;
    expenses: number;
    netProfit: number;
  };
  inventory: {
    totalKg: number;
    items: InventoryItem[];
  };
  topHouseholds: Household[];
  chartTrend: {
    date: string;
    weighedKg: number;
    cost: number;
    revenue: number;
  }[];
}
