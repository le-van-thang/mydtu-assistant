"use client";

export default function LoadingReport() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center p-8">
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent)]/20"></div>
        <div className="relative flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] shadow-xl">
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" className="opacity-20" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div className="text-xl font-bold text-[var(--text-main)]">
        Đang phân tích dữ liệu lịch thi
      </div>
      <div className="mt-2 text-sm text-[var(--text-muted)] animate-pulse">
        Quá trình này có thể mất vài giây...
      </div>
    </div>
  );
}
