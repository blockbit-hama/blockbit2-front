import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';

export default function Wallet(props: { disableCustomTheme?: boolean }) {
    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <AppAppBar />
            <Container
                maxWidth="lg"
                component="main"
                sx={{ display: 'flex', flexDirection: 'column', my: 16, gap: 4 }}
            >

                {/*<WalletTable></WalletTable>*/}

            </Container>
        </AppTheme>
    );
}
