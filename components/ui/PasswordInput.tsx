"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  error?: boolean;
}

export function PasswordInput({ label, className, error, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={className}>
      {label && <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>}
      <div className="relative">
        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className={cn(
            "w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-[#1e3820] outline-none transition-all",
            error ? "border-red-300 focus:ring-red-200" : "border-gray-300"
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
          tabIndex={-1} // Prevent tabbing to this button before input
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
