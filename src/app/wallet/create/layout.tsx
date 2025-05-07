import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Wallet - BlockBit',
  description: 'Create a new cryptocurrency wallet.',
};

export default function WalletCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
