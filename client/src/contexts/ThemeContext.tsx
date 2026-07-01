import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ThemeContext } from "./themeContextCore";
import type { Theme } from "./themeContextCore";

export const ThemeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [theme, setTheme] =
    useState<Theme>(() => {
      return (
        (localStorage.getItem(
          "sentinelshield-theme"
        ) as Theme | null) || "dark"
      );
    });

  const applyTheme = (nextTheme: Theme) => {
    document.documentElement.classList.remove(
      "light",
      "dark"
    );

    document.documentElement.classList.add(
      nextTheme
    );

    localStorage.setItem(
      "sentinelshield-theme",
      nextTheme
    );
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme =
        prev === "dark" ? "light" : "dark";

      applyTheme(nextTheme);

      return nextTheme;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
