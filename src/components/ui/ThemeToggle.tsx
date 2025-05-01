"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { SunIcon, MoonIcon, LaptopIcon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-md">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded ${
          theme === "light" 
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
        aria-label="Light theme"
        title="Light theme"
      >
        <SunIcon className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded ${
          theme === "dark" 
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
        aria-label="Dark theme"
        title="Dark theme"
      >
        <MoonIcon className="h-4 w-4" />
      </button>
      
      <button
        onClick={() => setTheme("auto")}
        className={`p-1.5 rounded ${
          theme === "auto" 
            ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
        }`}
        aria-label="System theme"
        title="System theme"
      >
        <LaptopIcon className="h-4 w-4" />
      </button>
    </div>
  );
} 