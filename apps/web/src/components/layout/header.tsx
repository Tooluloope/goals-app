'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronDown,
  Target,
  Users,
  Menu,
  LayoutDashboard,
  Kanban,
  Calendar,
  Bell,
  Settings,
  LogOut,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  BarChart3,
  Folder,
  Search,
  Map,
  Bot,
  GitBranch,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

// Navigation items for personal workspaces
const personalNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Daily Rhythm', href: '/rhythm', icon: BookOpen },
  { name: 'Habit Manager', href: '/habits', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Dependencies', href: '/dependencies', icon: GitBranch },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Weekly Review', href: '/reviews/weekly', icon: CalendarCheck },
  { name: 'Monthly Review', href: '/reviews/monthly', icon: CalendarDays },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Navigation items for family workspaces
const familyNavigation = [
  { name: 'Family Hub', href: '/family', icon: Home },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Goals', href: '/projects', icon: Folder },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Dependencies', href: '/dependencies', icon: GitBranch },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, currentWorkspace, workspaces, setCurrentWorkspace, logout } = useAuthStore();
  const { setCommandPaletteOpen } = useUIStore();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const [sheetOpen, setSheetOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    setSheetOpen(false);
    logout();
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Hamburger Menu */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-4 py-4">
              <SheetTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Target className="h-4 w-4 text-primary-foreground" />
                </div>
                <span>Alignia</span>
              </SheetTitle>
            </SheetHeader>

            {/* Workspace Selector */}
            <div className="border-b px-4 py-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {currentWorkspace?.type === 'family' ? (
                        <Users className="h-4 w-4 shrink-0" />
                      ) : (
                        <Target className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">
                        {currentWorkspace?.name || 'Select workspace'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem
                      key={workspace.id}
                      onClick={() => setCurrentWorkspace(workspace)}
                      className={cn(
                        'min-w-0',
                        currentWorkspace?.id === workspace.id && 'bg-accent'
                      )}
                    >
                      {workspace.type === 'family' ? (
                        <Users className="mr-2 h-4 w-4 shrink-0" />
                      ) : (
                        <Target className="mr-2 h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{workspace.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Navigation */}
            <ScrollArea className="h-[calc(100vh-200px)]">
              <nav className="flex flex-col gap-1 p-4">
                {(currentWorkspace?.type === 'family' ? familyNavigation : personalNavigation).map(
                  (item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link key={item.name} href={item.href} onClick={() => setSheetOpen(false)}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn('w-full justify-start', isActive && 'bg-secondary')}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                          {item.name === 'Notifications' && (unreadCount ?? 0) > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                              {unreadCount! > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </Button>
                      </Link>
                    );
                  }
                )}
              </nav>
            </ScrollArea>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Title / Workspace */}
        <span className="font-semibold truncate max-w-[140px]">
          {title || currentWorkspace?.name || 'Alignia'}
        </span>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCommandPaletteOpen(true)}
            className="shrink-0"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative shrink-0">
              <Bell className="h-5 w-5" />
              {(unreadCount ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount! > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </Link>

          {/* User Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
