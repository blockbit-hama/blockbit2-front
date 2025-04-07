"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/theme/theme";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
        <body>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
