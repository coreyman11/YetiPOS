
import { Json } from "../json"

export interface EmployeeReportsTables {
  employee_reports: {
    Row: {
      id: string
      employee_id: string | null
      total_sales: number
      transaction_count: number
      average_sale: number
      credit_card_sales: number
      cash_sales: number
      gift_card_sales: number
      discounts_applied: number
      return_transactions: number
      unique_customers: number
      report_date: string
      location_id: string | null
    }
    Insert: {
      id?: string
      employee_id?: string | null
      total_sales?: number
      transaction_count?: number
      average_sale?: number
      credit_card_sales?: number
      cash_sales?: number
      gift_card_sales?: number
      discounts_applied?: number
      return_transactions?: number
      unique_customers?: number
      report_date?: string
      location_id?: string | null
    }
    Update: {
      id?: string
      employee_id?: string | null
      total_sales?: number
      transaction_count?: number
      average_sale?: number
      credit_card_sales?: number
      cash_sales?: number
      gift_card_sales?: number
      discounts_applied?: number
      return_transactions?: number
      unique_customers?: number
      report_date?: string
      location_id?: string | null
    }
  }
}
