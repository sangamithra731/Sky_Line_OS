import { useEffect, useState } from "react";

export default function useTheme() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem("skyline-theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("skyline-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("skyline-theme", "light");
    }
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  return { dark, toggle };
}