"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Link from "next/link";

export default function SimpleHeader() {
    return (
        <AppBar position="static" color="transparent" elevation={0}>
            <Toolbar sx={{ justifyContent: "space-between", padding: "10px 20px" }}>
                {/* 로고 및 서비스명 */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <img src="/logo.png" alt="BlockBit Logo" width={40} height={40} style={{ marginRight: "10px" }} />
                    <Typography variant="h6" color="primary" sx={{ fontWeight: "bold" }}>
                        BlockBit
                    </Typography>
                </Box>

                {/* 네비게이션 메뉴 */}
                <Box sx={{ display: "flex", gap: "20px" }}>
                    <Link href="/wallet" passHref>
                        <Button color="primary">Wallet</Button>
                    </Link>
                    <Link href="/trade" passHref>
                        <Button color="primary">Trade</Button>
                    </Link>
                    <Link href="/quant" passHref>
                        <Button color="primary">Quant</Button>
                    </Link>
                </Box>

                {/* 로그인 & 회원가입 */}
                <Box sx={{ display: "flex", gap: "10px" }}>
                    <Link href="/login" passHref>
                        <Button variant="outlined" color="primary">로그인</Button>
                    </Link>
                    <Link href="/signup" passHref>
                        <Button variant="contained" color="primary">회원가입</Button>
                    </Link>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
