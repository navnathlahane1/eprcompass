import { SoftphoneProvider } from '@/components/telecalling/SoftphoneContext';
import Softphone from '@/components/telecalling/Softphone';

export default function TelecallingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SoftphoneProvider>
      {children}
      <Softphone />
    </SoftphoneProvider>
  );
}
