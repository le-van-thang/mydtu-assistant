export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
          <p className="text-sm font-medium text-slate-400">Tổng số sinh viên</p>
          <p className="mt-2 text-3xl font-bold text-white">1,234</p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">
          <p className="text-sm font-medium text-slate-400">Số lượng truy vấn AI hôm nay</p>
          <p className="mt-2 text-3xl font-bold text-white">856</p>
        </div>
        {/* ... stats ... */}
      </div>
      <div className="rounded-2xl bg-slate-900 p-8 border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-4">Chào mừng đến với Dashboard Admin</h2>
        <p className="text-slate-400">Khu vực quản lý tập trung toàn hệ thống OmniScholar AI.</p>
      </div>
    </div>
  );
}
