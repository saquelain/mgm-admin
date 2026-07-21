'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/notices', label: 'Notices' },
  { href: '/courses', label: 'Courses' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const admin = useAuthStore((state) => state.admin);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-56 bg-white border-r min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">MGM Admin</h2>
        {admin && <p className="text-xs text-gray-500 mt-1">{admin.username}</p>}
      </div>

      <nav className="flex-1 p-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded text-sm mb-1 ${
              pathname === link.href
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded text-sm text-red-600 hover:bg-red-50"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}