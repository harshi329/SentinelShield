import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, ChevronDown, Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../contexts/AuthContext";
import CyberAvatar from "./CyberAvatar";

const TopNavbar = () => {
  const { user, logout, avatarId } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-6 py-3 bg-white/80 dark:bg-slate-950/60 backdrop-blur-xl">

      {/* Left — title */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">SentinelShield</h2>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Advanced Security Platform</p>
      </div>

      {/* Right — status + theme + profile */}
      <div className="flex items-center gap-3 shrink-0">

        {/* System active badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5 text-xs text-green-500 dark:text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          System Active
        </div>

        <ThemeToggle />

        {/* Profile dropdown */}
        {user && (
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 transition-all hover:border-sky-500/50 hover:bg-sky-500/5"
            >
              <CyberAvatar avatarId={avatarId} size="sm" />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[100px]">{user.email}</p>
              </div>
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl shadow-black/20 z-50 overflow-hidden"
                >
                  {/* User info header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/10">
                    <CyberAvatar avatarId={avatarId} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-2">
                    <DropdownItem
                      icon={<User size={15} />}
                      label="Profile"
                      onClick={() => { setOpen(false); }}
                    />
                    <DropdownItem
                      icon={<Shield size={15} />}
                      label="Security"
                      onClick={() => { setOpen(false); navigate("/settings"); }}
                    />
                    <DropdownItem
                      icon={<Settings size={15} />}
                      label="Settings"
                      onClick={() => { setOpen(false); navigate("/settings"); }}
                    />
                    <div className="my-1 border-t border-slate-100 dark:border-white/10" />
                    <DropdownItem
                      icon={<LogOut size={15} />}
                      label="Sign Out"
                      danger
                      onClick={handleLogout}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

const DropdownItem = ({
  icon, label, onClick, danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
      danger
        ? "text-red-500 hover:bg-red-500/10"
        : "text-slate-600 dark:text-slate-300 hover:bg-sky-500/10 hover:text-sky-500"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default TopNavbar;
