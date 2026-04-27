export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_role: 'owner' | 'admin' | 'sales' | 'technician' | 'viewer'
      lead_status: 'new' | 'contacted' | 'qualified' | 'lost' | 'converted'
      customer_type: 'residential' | 'business' | 'community' | 'industrial'
      deal_status: 'open' | 'won' | 'lost'
      proposal_status: 'draft' | 'sent' | 'accepted' | 'rejected'
      contract_status: 'draft' | 'sent' | 'signed' | 'cancelled'
      installation_status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      task_status: 'pending' | 'in_progress' | 'done' | 'cancelled'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
      document_type: 'invoice' | 'proposal' | 'contract' | 'dni' | 'cif' | 'technical_photo' | 'other'
    }
    CompositeTypes: Record<string, never>
  }
}
