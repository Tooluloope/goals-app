'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Users,
  Bell,
  LogOut,
  ChevronRight,
  Mail,
  Shield,
  Settings2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { user, currentWorkspace, workspaces, logout } = useAuthStore();
  const { getConfig, initializeConfig, updateNotificationSettings, updateDashboardSettings } = useConfigStore();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  // Initialize config when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      initializeConfig(currentWorkspace.id);
    }
  }, [currentWorkspace, initializeConfig]);

  const config = currentWorkspace ? getConfig(currentWorkspace.id) : null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDueSoonChange = (value: string) => {
    if (!currentWorkspace) return;
    updateDashboardSettings(currentWorkspace.id, { dueSoonDays: parseInt(value) });
    toast({
      title: 'Settings updated',
      variant: 'success',
    });
  };

  const handleReviewRemindersChange = (checked: boolean) => {
    if (!currentWorkspace) return;
    updateNotificationSettings(currentWorkspace.id, { reviewReminders: checked });
    toast({
      title: 'Settings updated',
      variant: 'success',
    });
  };

  const handleInvite = () => {
    // Mock invite
    toast({
      title: 'Invitation sent',
      description: `An invitation has been sent to ${inviteEmail}`,
      variant: 'success',
    });
    setInviteEmail('');
    setIsInviteDialogOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <AppLayout title="Settings">
      <div className="container max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{user?.name}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workspaces Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Workspaces
            </CardTitle>
            <CardDescription>
              Manage your personal and shared workspaces
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      workspace.type === 'family'
                        ? 'bg-pink-100 text-pink-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {workspace.type === 'family' ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workspace.memberIds.length} member
                      {workspace.memberIds.length !== 1 && 's'}
                    </p>
                  </div>
                </div>
                {currentWorkspace?.id === workspace.id && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
            ))}

            {/* Configure Workspace */}
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push('/settings/configure')}
            >
              <span className="flex items-center">
                <Settings2 className="mr-2 h-4 w-4" />
                Configure Workspace
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Invite to Family Workspace */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Invite to Family Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Family Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your family workspace
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="spouse@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={!inviteEmail}>
                    Send Invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dueSoon">Due soon window</Label>
                <p className="text-sm text-muted-foreground">
                  How many days before a task is due to notify you
                </p>
              </div>
              <Select
                value={config?.dashboard.dueSoonDays?.toString() || '14'}
                onValueChange={handleDueSoonChange}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reviewReminders">Review reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when reviews are due
                </p>
              </div>
              <Switch
                id="reviewReminders"
                checked={config?.notifications.reviewReminders ?? true}
                onCheckedChange={handleReviewRemindersChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Built with</span>
              <span className="font-medium">Next.js + TypeScript</span>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
