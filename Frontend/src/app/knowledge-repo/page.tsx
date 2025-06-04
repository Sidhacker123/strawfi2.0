"use client";

import dynamic from 'next/dynamic';
import Header from "../components/Header";

// Dynamically import the KnowledgeRepository component with no SSR
const KnowledgeRepository = dynamic(
  () => import('../components/knowledge-repo'),
  { ssr: false }
);

export default function KnowledgeRepoPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <KnowledgeRepository />
    </main>
  );
} 