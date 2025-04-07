"use client";

import * as React from 'react';
import {styled, alpha} from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

import Link from "next/link";
import {BlockBitIcon} from "@/components/CustomIcons";
import {isLoggedIn, logout} from "@/lib/auth";

const StyledToolbar = styled(Toolbar)(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
    backdropFilter: 'blur(24px)',
    border: '1px solid',
    borderColor: (theme.vars || theme).palette.divider,
    backgroundColor: theme.vars
        ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
        : alpha(theme.palette.background.default, 0.4),
    boxShadow: (theme.vars || theme).shadows[1],
    padding: '8px 12px',
}));

export default function AppAppBar() {
    const [loggedIn, setLoggedIn] = React.useState(false);

    React.useEffect(() => {
        // 컴포넌트가 마운트될 때와 클라이언트 사이드 렌더링 시 로그인 상태 확인
        if (typeof window !== 'undefined') {
            setLoggedIn(isLoggedIn());
        }
    }, []);

    const handleLogout = () => {
        logout();
        setLoggedIn(false);
        window.location.href = '/login';
    };

    return (
        <AppBar
            position="fixed"
            enableColorOnDark
            sx={{
                boxShadow: 0,
                bgcolor: 'transparent',
                backgroundImage: 'none',
                mt: 'calc(var(--template-frame-height, 0px) + 28px)',
            }}
        >
            <Container maxWidth="lg">
                <StyledToolbar variant="dense" disableGutters>
                    <Box sx={{flexGrow: 1, display: 'flex', alignItems: 'center', px: 0}}>
                        <img src="/logo.png" alt="BlockBit Logo" width={40} height={40} style={{marginRight: "10px"}}/>
                        <BlockBitIcon/>
                        <Box sx={{display: {xs: 'none', md: 'flex'}}}>
                            <Link href="/wallet" passHref>
                                <Button variant="text" color="info" size="medium">
                                    Wallet
                                </Button>
                            </Link>
                            <Button variant="text" color="info" size="medium">
                                Trade
                            </Button>
                            <Button variant="text" color="info" size="medium">
                                Quant
                            </Button>
                            <Button variant="text" color="info" size="medium" sx={{minWidth: 0}}>
                                FAQ
                            </Button>
                            <Link href="/blog" passHref>
                                <Button variant="text" color="info" size="medium" sx={{minWidth: 0}}>
                                    Blog
                                </Button>
                            </Link>
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: {xs: 'none', md: 'flex'},
                            gap: 1,
                            alignItems: 'center',
                        }}
                    >
                        {loggedIn ? (
                            <>
                                <Button color="primary" variant="outlined" size="small" onClick={handleLogout}>
                                    Logout
                                </Button>
                                <Link href="/profile" passHref>
                                    <Button color="primary" variant="contained" size="small">
                                        Profile
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/login" passHref>
                                    <Button color="primary" variant="outlined" size="small">
                                        Sign in
                                    </Button>
                                </Link>
                                <Link href="/signup" passHref>
                                    <Button color="primary" variant="contained" size="small">
                                        Sign up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </Box>
                </StyledToolbar>
            </Container>
        </AppBar>
    );
}
