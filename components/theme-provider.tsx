'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      scriptProps={{
        // React (Next 16) warns on executable <script> tags rendered on the
        // client; a data-block type on the client render avoids the warning
        // while the server-rendered script still executes during HTML parsing.
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
