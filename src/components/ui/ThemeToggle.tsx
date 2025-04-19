"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { SunIcon, MoonIcon, LaptopIcon } from "lucide-react";
import { useRef, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  const toggleMenu = () => {
    if (!isOpen) {
      setIsOpen(true);
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      setIsOpen(false);
      document.removeEventListener("mousedown", handleClickOutside);
    }
  };

  const selectTheme = (newTheme: "light" | "dark" | "auto") => {
    setTheme(newTheme);
    setIsOpen(false);
    document.removeEventListener("mousedown", handleClickOutside);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <MoonIcon className="h-5 w-5" />
        ) : (
          <SunIcon className="h-5 w-5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
          <div className="p-2 space-y-1">
            <button
              onClick={() => selectTheme("light")}
              className={`flex items-center w-full p-2 rounded-md ${
                theme === "light"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <SunIcon className="h-5 w-5 mr-2" />
              <span>Light</span>
            </button>

            <button
              onClick={() => selectTheme("dark")}
              className={`flex items-center w-full p-2 rounded-md ${
                theme === "dark"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <MoonIcon className="h-5 w-5 mr-2" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => selectTheme("auto")}
              className={`flex items-center w-full p-2 rounded-md ${
                theme === "auto"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <LaptopIcon className="h-5 w-5 mr-2" />
              <span>System</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 