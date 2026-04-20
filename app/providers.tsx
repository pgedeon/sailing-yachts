"use client";

import { SessionProvider } from "next-auth/react";
import { FeatureFlagProvider, type FeatureFlagProviderProps } from "@/lib/feature-flags/context";

interface AuthProviderProps {
  children: React.ReactNode;
  featureFlags?: FeatureFlagProviderProps["flags"];
}

export default function AuthProvider({
  children,
  featureFlags = {},
}: AuthProviderProps) {
  return (
    <SessionProvider>
      <FeatureFlagProvider flags={featureFlags}>
        {children}
      </FeatureFlagProvider>
    </SessionProvider>
  );
}
