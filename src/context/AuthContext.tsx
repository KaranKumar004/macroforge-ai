"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

interface User {
  email: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  credits: number;
  isPro: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginWithOAuth: (provider: "google" | "github") => Promise<void>;
  logout: () => Promise<void>;
  deductCredit: () => Promise<void>;
  addCredits: (amount: number) => Promise<void>;
  upgradeToPro: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile details (credits, isPro status)
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("credits, is_pro")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setCredits(data.credits);
        setIsPro(data.is_pro);
      } else if (error) {
        // If profile is missing (e.g. trigger delay), create one
        console.warn("User profile not found, creating a new profile fallback...");
        const { data: newProfile } = await supabase
          .from("user_profiles")
          .upsert({ id: userId, email: user?.email || "", credits: 5, is_pro: false })
          .select()
          .single();
        if (newProfile) {
          setCredits(newProfile.credits);
          setIsPro(newProfile.is_pro);
        }
      }
    } catch (err) {
      console.error("Failed to retrieve profile:", err);
    }
  };

  // Check session on mount and handle state updates
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ email: session.user.email!, id: session.user.id });
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Init session error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Subscribe to session state triggers
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      if (session?.user) {
        setUser({ email: session.user.email!, id: session.user.id });
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setCredits(0);
        setIsPro(false);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password is required for credentials login.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const loginWithOAuth = async (provider: "google" | "github") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign out failed:", error);
  };

  const deductCredit = async () => {
    if (isPro || !user) return;
    const nextCredits = Math.max(0, credits - 1);
    setCredits(nextCredits);
    try {
      await supabase
        .from("user_profiles")
        .update({ credits: nextCredits })
        .eq("id", user.id);
    } catch (err) {
      console.error("Deduct credit failed:", err);
    }
  };

  const addCredits = async (amount: number) => {
    if (!user) return;
    const nextCredits = credits + amount;
    setCredits(nextCredits);
    try {
      await supabase
        .from("user_profiles")
        .update({ credits: nextCredits })
        .eq("id", user.id);
    } catch (err) {
      console.error("Add credits failed:", err);
    }
  };

  const upgradeToPro = async () => {
    if (!user) return;
    setIsPro(true);
    try {
      await supabase
        .from("user_profiles")
        .update({ is_pro: true })
        .eq("id", user.id);
    } catch (err) {
      console.error("Upgrade to Pro failed:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        credits,
        isPro,
        isLoading,
        login,
        signUp,
        loginWithOAuth,
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
