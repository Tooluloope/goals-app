'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Kanban, Calendar, Bell, BookOpen, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications';

const navigation = [
  { name: 'Today', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI', href: '/ai', icon: Bot },
  { name: 'Rhythm', href: '/rhythm', icon: BookOpen },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Alerts', href: '/notifications', icon: Bell },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadNotificationsCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-medium transition-colors tap-target',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn('h-6 w-6 transition-transform', isActive && 'scale-110')}
                />
                {item.name === 'Alerts' && (unreadCount ?? 0) > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                    {unreadCount! > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn(isActive && 'font-semibold')}>{item.name}</span>
              {isActive && (
                <span className="absolute -top-px left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
