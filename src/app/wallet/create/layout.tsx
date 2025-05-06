import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '지갑 생성 - BlockBit',
  description: '새로운 암호화폐 지갑을 생성합니다.',
};

export default function WalletCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
