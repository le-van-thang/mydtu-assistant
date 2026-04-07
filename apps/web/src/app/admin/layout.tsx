import Link from "next/link";
import { LayoutDashboard, Users, Database } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const menus = [
    { name: "Tổng quan", href: "/admin/home", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Quản lý User", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { name: "AI Training Data", href: "/admin/training-data", icon: <Database className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-white tracking-wide">
            OmniScholar <span className="text-rose-500">Admin</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {menus.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              A
            </div>
            <span>Admin Control Panel</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex h-16 items-center px-8 border-b border-slate-800 bg-slate-900/50">
          <h1 className="text-lg font-semibold text-white">Hệ thống quản trị</h1>
        </div>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
