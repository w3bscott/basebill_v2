'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';
import { ThemeToggle } from './ThemeToggle';
import { LayoutDashboard, ReceiptText, Plus, FileText, Menu, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const NavigationBar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Placeholder state until Wagmi is integrated in Stage 3
  const isConnected = false;
  const address = '';

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', href: '/dashboard', icon: FileText },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <ReceiptText className="text-primary-foreground size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Base<span className="text-primary">Bill</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name}
                    href={link.href}
                    className={cn(
                      buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                      "gap-2 text-sm cursor-pointer"
                    )}
                  >
                    <link.icon className="size-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WalletButton isConnected={isConnected} address={address} />
              <Link 
                href="/create"
                className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
              >
                <Plus className="size-4" />
                Create Invoice
              </Link>
            </div>
          </div>

          {/* Mobile Connect & Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <WalletButton isConnected={isConnected} address={address} className="h-8 px-3 text-xs" />
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
          <div className="p-4 flex flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "default" }),
                    "justify-start gap-2 w-full cursor-pointer"
                  )}
                >
                  <link.icon className="size-4" />
                  {link.name}
                </Link>
              );
            })}
            <Link 
              href="/create"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(buttonVariants({ variant: "default", size: "default" }), "justify-center gap-2 w-full mt-2 cursor-pointer")}
            >
              <Plus className="size-4" />
              Create Invoice
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
