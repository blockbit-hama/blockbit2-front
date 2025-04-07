"use client";

import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import AppTheme from '@/theme/AppTheme';
import AppAppBar from '@/components/AppAppBar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';

export default function BlockBitLanding(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <AppAppBar />
      <Hero />
      <div>
        {/*<LogoCollection />*/}
        {/*<Features />*/}
        {/*<Divider />*/}
        {/*<Testimonials />*/}
        {/*<Divider />*/}
        {/*<Highlights />*/}
        {/*<Divider />*/}
        {/*<Pricing />*/}
        {/*<Divider />*/}
        {/*<FAQ />*/}
        <Divider />
        <Footer />
      </div>
    </AppTheme>
  );
}
