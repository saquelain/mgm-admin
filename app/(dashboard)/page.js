'use client';
import { useAuthStore } from '@/lib/store';

export default function DashboardHome() {
  const admin = useAuthStore((state) => state.admin);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Welcome{admin ? `, ${admin.username}` : ''}</h1>
      <p className="text-gray-500 text-sm">Manage gallery categories and notices from the sidebar.</p>
    </div>
  );
}