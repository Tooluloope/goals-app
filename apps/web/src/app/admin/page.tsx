'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';

type AdminOverview = {
  totals: {
    users: number;
    plans: Record<'FREE' | 'PRO' | 'FAMILY', number>;
    statuses: Record<string, number>;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    lastLoginAt: string | null;
    loginCount: number;
    plan: 'FREE' | 'PRO' | 'FAMILY';
    subscriptionStatus: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  }>;
};

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [includeEmail, setIncludeEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;

  const loadData = async (showEmail: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      const overview = await apiClient.getAdminOverview({
        includeEmail: showEmail,
        limit: 100,
      });
      setData(overview);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load admin overview';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadData(includeEmail);
  }, [includeEmail, isAdmin]);

  const planTotals = useMemo(() => {
    return data?.totals.plans ?? { FREE: 0, PRO: 0, FAMILY: 0 };
  }, [data]);

  if (!isAdmin) {
    return (
      <AppLayout title="Admin">
        <div className="container max-w-3xl px-4 py-10">
          <Card className="p-6 text-center">
            <h1 className="text-xl font-semibold">Admin access required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You do not have permission to view this dashboard.
            </p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin Dashboard">
      <div className="container max-w-6xl px-4 py-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Overview</h1>
            <p className="text-sm text-muted-foreground">
              Usage, subscriptions, and login activity.
            </p>
          </div>
          {isSuperAdmin && (
            <div className="flex items-center gap-3">
              <Switch
                id="include-email"
                checked={includeEmail}
                onCheckedChange={(checked) => setIncludeEmail(checked)}
              />
              <Label htmlFor="include-email" className="text-sm">
                Show full emails
              </Label>
            </div>
          )}
        </div>

        {error && <Card className="p-4 text-sm text-destructive">{error}</Card>}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Total Users</p>
            <p className="mt-2 text-2xl font-semibold">{data?.totals.users ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Free</p>
            <p className="mt-2 text-2xl font-semibold">{planTotals.FREE}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Pro</p>
            <p className="mt-2 text-2xl font-semibold">{planTotals.PRO}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase text-muted-foreground">Family</p>
            <p className="mt-2 text-2xl font-semibold">{planTotals.FAMILY}</p>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Users</h2>
            <Button variant="outline" size="sm" onClick={() => loadData(includeEmail)}>
              Refresh
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 text-left">User</th>
                  <th className="py-2 text-left">Email</th>
                  <th className="py-2 text-left">Plan</th>
                  <th className="py-2 text-left">Status</th>
                  <th className="py-2 text-left">Last Login</th>
                  <th className="py-2 text-left">Logins</th>
                  <th className="py-2 text-left">Role</th>
                  {isSuperAdmin && <th className="py-2 text-left">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="py-4 text-muted-foreground" colSpan={isSuperAdmin ? 8 : 7}>
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && data?.users.length === 0 && (
                  <tr>
                    <td className="py-4 text-muted-foreground" colSpan={isSuperAdmin ? 8 : 7}>
                      No users found.
                    </td>
                  </tr>
                )}
                {data?.users.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.id}</div>
                    </td>
                    <td className="py-3">{row.email}</td>
                    <td className="py-3">
                      <Badge variant="outline">{row.plan}</Badge>
                    </td>
                    <td className="py-3">
                      <span className="text-xs text-muted-foreground">
                        {row.subscriptionStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3">{row.loginCount ?? 0}</td>
                    <td className="py-3">
                      <Badge variant="secondary">{row.role}</Badge>
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3">
                        {row.role === 'SUPER_ADMIN' ? (
                          <span className="text-xs text-muted-foreground">Primary</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const nextRole = row.role === 'ADMIN' ? 'USER' : 'ADMIN';
                              await apiClient.updateUserRole({
                                userId: row.id,
                                role: nextRole,
                              });
                              loadData(includeEmail);
                            }}
                          >
                            Make {row.role === 'ADMIN' ? 'User' : 'Admin'}
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
