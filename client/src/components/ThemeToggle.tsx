import { Moon, Sun } from "lucide-react";
import { useTheme } from "../contexts/themeContextCore";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
      flex
      items-center
      gap-2
      rounded-xl
      border
      border-slate-300
      dark:border-white/10
      bg-slate-100
      dark:bg-slate-900/50
      px-4
      py-2
      text-slate-900
      dark:text-white
      transition-all
      hover:bg-slate-200
      dark:hover:bg-slate-800
      "
    >
      {theme === "dark" ? (
        <>
          <Moon
            size={18}
            className="text-sky-400"
          />
          <span>Secure View</span>
        </>
      ) : (
        <>
          <Sun
            size={18}
            className="text-amber-400"
          />
          <span>Analyst View</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
