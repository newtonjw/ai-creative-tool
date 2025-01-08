"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      defaultTheme="dark"
      themes={["light", "dark"]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}