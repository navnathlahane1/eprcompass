// Stub Database type — real types should be generated via `supabase gen types typescript`
type AnyRow = { Row: any; Insert: any; Update: any; Relationships: any[] };

export type Database = {
  public: {
    Enums: {
      waste_category: 'Plastic' | 'E-Waste' | 'Battery' | 'Tyre' | 'Oil';
      service_type: 'Registration' | 'Filing' | 'Renewal' | 'Certificate' | 'Consulting';
      service_status: 'Pending' | 'In Progress' | 'Filed' | 'Approved' | 'Overdue';
    };
    Tables: { [tableName: string]: AnyRow };
    Views: { [viewName: string]: { Row: any; Relationships: any[] } };
    Functions: { [fnName: string]: any };
    CompositeTypes: { [typeName: string]: unknown };
  };
};
