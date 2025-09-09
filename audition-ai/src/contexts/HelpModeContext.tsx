import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

interface HelpModeContextValue {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (value: boolean) => void;
}

const HelpModeContext = createContext<HelpModeContextValue | undefined>(undefined);

export const HelpModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("helpModeEnabled");
      return stored === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("helpModeEnabled", String(enabled));
    } catch {}
  }, [enabled]);

  const value = useMemo(
    () => ({
      enabled,
      toggle: () => setEnabled((v) => !v),
      setEnabled,
    }),
    [enabled]
  );

  return <HelpModeContext.Provider value={value}>{children}</HelpModeContext.Provider>;
};

export const useHelpMode = () => {
  const ctx = useContext(HelpModeContext);
  if (!ctx) throw new Error("useHelpMode must be used within HelpModeProvider");
  return ctx;
};
