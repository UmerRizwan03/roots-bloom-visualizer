// src/components/MobileNavigationLayout.tsx
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  // Import other necessary parts like PanelLeft from lucide-react if SidebarTrigger needs it explicitly
} from '@/components/ui/sidebar'; // Assuming this is the correct path to the generic sidebar UI
import { Button } from '@/components/ui/button'; // For the trigger
import { PanelLeft } from 'lucide-react'; // Hamburger icon
import { useIsMobile } from '@/hooks/use-mobile'; // To conditionally show trigger

interface MobileNavigationLayoutProps {
  children?: React.ReactNode; // children will be the page content from <Outlet />
}

const MobileNavigationLayout: React.FC<MobileNavigationLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Define navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: null }, // Add icons later if desired
    { path: '/members', label: 'Members', icon: null },
    { path: '/magazines', label: 'Magazines', icon: null },
    // Add other global navigation links here
  ];

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen"> {/* Main container */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            {isMobile && (
              <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-4 lg:hidden"> {/* lg:hidden ensures it's mainly for mobile */}
                  <PanelLeft className="h-6 w-6" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              </SidebarTrigger>
            )}
            {/* You can add a Logo or App Name here */}
            <div className="flex-1 text-lg font-semibold">My App</div>
            {/* Desktop navigation could go here if needed, or leave empty */}
          </div>
        </header>

        {/* Sidebar component from ui/sidebar.tsx for mobile */}
        <Sidebar side="left" collapsible="offcanvas"> {/* Ensures it's an offcanvas for mobile */}
          <SidebarHeader>
            <div className="p-4 text-lg font-semibold">Navigation</div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <Link to={item.path} className="w-full">
                    <SidebarMenuButton
                      className="w-full justify-start"
                      isActive={location.pathname === item.path}
                    >
                      {/* item.icon && <item.icon className="mr-2 h-5 w-5" /> */}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          {/* SidebarFooter could be added here if needed */}
        </Sidebar>

        {/* Main content area where routed pages will be rendered */}
        {/* The 'SidebarInset' component from ui/sidebar.tsx might be useful here to handle content shifting when sidebar is open on desktop, but for mobile-first, direct rendering is fine. */}
        <main className="flex-1 container py-4">
          {children ? children : <Outlet />} {/* Render children if passed, otherwise Outlet for nested routes */}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MobileNavigationLayout;
