// frontend/src/app/(papers)/papers/page.tsx
import PaperSearch from '@/components/papers/PaperSearch';

export default function PaperPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-white">Academic Paper Search</h1>
        <PaperSearch />
      </div>
    </div>
  );
}