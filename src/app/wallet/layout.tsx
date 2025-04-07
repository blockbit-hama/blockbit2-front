"use client";

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/theme/theme";

export default function WalletLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
        <body>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children} {/* 로그인 페이지 자체만 렌더링 */}
        </ThemeProvider>
        </body>
        </html>
    );
}
