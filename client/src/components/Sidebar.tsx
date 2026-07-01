import {
  LayoutDashboard, Search, FileText,
  BarChart3, Settings, Shield, LogOut,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import CyberAvatar from "./CyberAvatar";

const menuItems = [
  { name: "Dashboard",   icon: LayoutDashboard, path: "/" },
  { name: "Analyzer",    icon: Search,           path: "/analyzer" },
  { name: "Threat Logs", icon: FileText,         path: "/logs" },
  { name: "Analytics",   icon: BarChart3,        path: "/analytics" },
  { name: "Settings",    icon: Settings,         path: "/settings" },
];

const Sidebar = () => {
  const { user, logout, avatarId } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="flex w-56 shrink-0 min-h-screen flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950/60 shadow-sm dark:shadow-none backdrop-blur-xl">

      {/* Logo */}
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <Shield size={26} className="text-sky-500" />
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">SentinelShield</h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Security Platform</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 border-b border-slate-200 dark:border-white/10" />

      {/* Navigation */}
      <nav className="mt-4 flex-1 px-3">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
            >
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                      : "text-slate-600 dark:text-slate-300 hover:bg-sky-500/10 hover:text-sky-500"
                  }`
                }
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-6 border-b border-slate-200 dark:border-white/10" />

      {/* User card at bottom */}
      {user && (
        <div className="p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3"
          >
            {/* Avatar */}
            <CyberAvatar avatarId={avatarId} size="sm" />

            {/* Name + email */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut size={15} />
            </button>
          </motion.div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
