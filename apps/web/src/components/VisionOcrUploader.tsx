"use client";

import { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";

type VisionOcrUploaderProps = {
  onUploadComplete?: () => void;
};

export default function VisionOcrUploader({ onUploadComplete }: VisionOcrUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Vui lòng chọn file hình ảnh hợp lệ (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatus("error");
      setMessage("File quá lớn! Vui lòng chọn ảnh dưới 10MB.");
      return;
    }

    setStatus("uploading");
    setMessage("Đang tải ảnh và phân tích bằng Gemini Vision 2.5...");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;

      try {
        const res = await fetch("/api/transcript/upload-vision", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Quá trình phân tích thất bại.");
        }

        setStatus("success");
        setMessage(data.message || `Đã trích xuất và nhập thành công bảng điểm!`);
        if (onUploadComplete) onUploadComplete();

        // Reset sau 4 giây
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 4000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Lỗi kết nối đến server AI.");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 6000);
      }
    };

    reader.onerror = () => {
      setStatus("error");
      setMessage("Không thể đọc file ảnh.");
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full mb-6">
      <div 
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 transition-all duration-300 ${
          isDragging
            ? "border-violet-500 bg-violet-500/10 scale-[1.02]"
            : status === "uploading"
            ? "border-blue-500/50 bg-blue-500/5"
            : status === "success"
            ? "border-emerald-500/50 bg-emerald-500/5"
            : status === "error"
            ? "border-rose-500/50 bg-rose-500/5"
            : "border-slate-700 bg-slate-900/40 hover:border-violet-500/40 hover:bg-slate-800/60"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => status !== "uploading" && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleChange}
          disabled={status === "uploading"}
        />

        <div className="flex flex-col items-center justify-center text-center gap-4 cursor-pointer">
          {status === "uploading" ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : status === "success" ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          ) : status === "error" ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <AlertCircle className="h-8 w-8" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-violet-400 shadow-inner group-hover:scale-110 transition-transform">
              <UploadCloud className="h-8 w-8" />
            </div>
          )}

          <div>
            {status === "uploading" ? (
              <>
                <h3 className="text-lg font-bold text-slate-200">AI đang xử lý...</h3>
                <p className="mt-1 text-sm text-slate-400">{message}</p>
              </>
            ) : status === "success" ? (
              <>
                <h3 className="text-lg font-bold text-emerald-400">Thành công!</h3>
                <p className="mt-1 text-sm text-emerald-200/70">{message}</p>
              </>
            ) : status === "error" ? (
              <>
                <h3 className="text-lg font-bold text-rose-400">Đã xảy ra lỗi</h3>
                <p className="mt-1 text-sm text-rose-200/70">{message}</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-200 group-hover:text-violet-300">
                  Kéo thả ảnh Bảng điểm vào đây
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Hoặc click để chọn file. Bảng điểm sẽ được OCR siêu tốc bằng <span className="font-semibold text-violet-400 flex items-center justify-center gap-1 inline-flex"><Sparkles className="h-3 w-3"/>Gemini Vision AI</span>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
