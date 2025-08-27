'use client';

import React from 'react';
import NavBar from '@/components/nav/NavBar';
import SiteFooter from '@/components/footer/SiteFooter';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return <div className="flex-1">{children}</div>;
}
