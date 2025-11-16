"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  role: "admin" | "editor" | "reporter" | "user";
  hasReader: boolean;
  hasReporter: boolean;
  hasEditor: boolean;
}

interface NavigationProps {
  appFullName: string;
}

export default function Navigation({ appFullName }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null);
  const [_loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Re-check auth status when pathname changes
  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    window.location.href = "/";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigation configuration
  const navigationItems = [
    { href: "/editions", text: "Editions", condition: true },
    { href: "/reporters", text: "Reporters", condition: !!user },
    { href: "/articles", text: "Articles", condition: !!user?.hasReader },
    { href: "/ads", text: "Ads", condition: !!user },
    { href: "/account", text: "Account", condition: !!user },
    { href: "/events", text: "Events", condition: true }
  ];

  const adminItems = [
    { href: "/users", text: "Users" },
    { href: "/admin/bluesky-messages", text: "Bluesky Messages" },
    { href: "/editor", text: "Editor Settings", isEditorButton: true }
  ];

  const renderNavigationLink = (
    item: (typeof navigationItems)[0],
    isMobile: boolean
  ) => {
    if (!item.condition) return null;

    const baseClasses = isMobile
      ? "text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-base font-medium transition-colors"
      : "text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors";

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={isMobile ? closeMobileMenu : undefined}
        className={baseClasses}
      >
        {item.text}
      </Link>
    );
  };

  const renderAdminLink = (item: (typeof adminItems)[0], isMobile: boolean) => {
    const baseClasses = isMobile
      ? item.isEditorButton
        ? "bg-blue-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
        : "text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-sm font-medium transition-colors"
      : item.isEditorButton
        ? "bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
        : "text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-xs font-medium transition-colors";

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={isMobile ? closeMobileMenu : undefined}
        className={baseClasses}
      >
        {item.text}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h14a2 2 0 012 2v2H3V5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12h.01M11 12h.01M15 12h.01M7 16h.01M11 16h.01M15 16h.01"
                  />
                </svg>
              </div>
              <span className="text-base font-bold text-slate-800">
                {appFullName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navigationItems.map((item) => renderNavigationLink(item, false))}

            {/* Admin-only links */}
            {user?.role === "admin" && (
              <>{adminItems.map((item) => renderAdminLink(item, false))}</>
            )}

            {/* Show login/logout based on auth status */}
            {user ? (
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="text-slate-600 hover:text-slate-900 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-slate-200">
          {navigationItems.map((item) => renderNavigationLink(item, true))}

          {/* Admin-only links */}
          {user?.role === "admin" && (
            <>{adminItems.map((item) => renderAdminLink(item, true))}</>
          )}

          {/* Mobile auth section */}
          <div className="border-t border-slate-200 pt-4 mt-4">
            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="text-slate-600 hover:text-slate-900 block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="text-slate-600 hover:text-slate-900 block px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
