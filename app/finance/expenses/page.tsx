import ModuleStub from '@/components/finance/ModuleStub';

export default function ExpensesPage() {
  return (
    <ModuleStub
      title="Expense Management"
      description="Employee expense submission, approval workflow, category analytics, and reimbursement processing."
      icon="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      accent="blue"
      features={[
        'Expense submission with receipt upload (PDF/image)',
        'Multi-level approval workflow (Manager → Finance → CFO)',
        'Category analytics: travel, food, software, marketing',
        'Department-wise expense budget vs actual',
        'Reimbursement processing with payment tracking',
        'GST input credit identification on expenses',
      ]}
    />
  );
}
