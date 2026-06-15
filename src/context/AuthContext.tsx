"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  credits: number;
  isPro: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void> | void;
  logout: () => void;
  deductCredit: () => void;
  addCredits: (amount: number) => void;
  upgradeToPro: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(5);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("mf_user");
    const savedCredits = localStorage.getItem("mf_credits");
    const savedPro = localStorage.getItem("mf_pro");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedCredits !== null) {
      setCredits(parseInt(savedCredits, 10));
    } else {
      localStorage.setItem("mf_credits", "5");
    }
    if (savedPro !== null) {
      setIsPro(savedPro === "true");
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    const newUser = { email };
    setUser(newUser);
    localStorage.setItem("mf_user", JSON.stringify(newUser));

    try {
      await supabase.from("user_emails").upsert({ email }, { onConflict: "email" });
    } catch (err) {
      console.error("Failed to insert email to Supabase:", err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mf_user");
  };

  const deductCredit = () => {
    if (isPro) return;
    setCredits((prev) => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem("mf_credits", next.toString());
      return next;
    });
  };

  const addCredits = (amount: number) => {
    setCredits((prev) => {
      const next = prev + amount;
      localStorage.setItem("mf_credits", next.toString());
      return next;
    });
  };

  const upgradeToPro = () => {
    setIsPro(true);
    localStorage.setItem("mf_pro", "true");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        credits,
        isPro,
        isLoading,
        login,
        logout,
        deductCredit,
        addCredits,
        upgradeToPro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
