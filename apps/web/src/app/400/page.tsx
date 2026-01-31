import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BadRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-semibold">400 - Bad request</h1>
        <p className="text-sm text-muted-foreground">
          The link or request looks invalid. Please check the URL and try again.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <Button className="w-full">Go to login</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
