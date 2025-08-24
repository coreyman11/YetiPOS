
import { InventoryTables } from "./database/inventory"
import { TransactionsTables } from "./database/transactions"
import { CustomersTables } from "./database/customers"
import { LoyaltyTables } from "./database/loyalty"
import { ServicesTables } from "./database/services"
import { PrintersTables } from "./database/printers"
import { PaymentsTables } from "./database/payments"
import { TaxesTables } from "./database/taxes"
import { UsersTables } from "./database/users"
import { StoresTables } from "./database/stores"
import { GiftCardsTables } from "./database/gift-cards"
import { ShiftsTables } from "./database/shifts"
import { DiscountsTables } from "./database/discounts"
import { ReceiptsTables } from "./database/receipts"
import { EmployeeReportsTables } from "./database/employee-reports"

export interface Database {
  public: {
    Tables: InventoryTables & 
            TransactionsTables & 
            CustomersTables & 
            LoyaltyTables & 
            ServicesTables & 
            PrintersTables &
            PaymentsTables &
            TaxesTables &
            UsersTables &
            StoresTables &
            GiftCardsTables &
            ShiftsTables &
            DiscountsTables &
            ReceiptsTables &
            EmployeeReportsTables
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type { Json } from "./json"
