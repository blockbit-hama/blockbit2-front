"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AssetWallets(props: { disableCustomTheme?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {

    } catch (error) {

    }
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AppAppBar />
      <Container
        maxWidth="lg"
        component="main"
        sx={{ display: 'flex', flexDirection: 'column', mt: 16, mb: 8, gap: 4 }}
      >
        {/* 브레드크럼 네비게이션 */}
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleBack();
            }}
          >
            Assets
          </Link>
          <Typography color="text.primary">{assetSymbol}</Typography>
        </Breadcrumbs>
      </Container>
    </AppTheme>
  );
}