import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ServerErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-semibold">500 - Server error</h1>
        <p className="text-sm text-muted-foreground">
          Something went wrong on our side. Please try again in a moment.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button className="w-full">Back to dashboard</Button>
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
