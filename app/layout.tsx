import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'TYPE / SYSTEM — 给普通程序员的类型系统导论',
  description: '从 TypeScript 与 Rust 出发，逐个拆解类型系统公式，重点讲解 Hindley–Milner、双向检查及现代类型理论路线。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
