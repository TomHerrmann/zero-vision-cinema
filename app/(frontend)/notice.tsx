import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface NoticeProp {
  title?: string;
  description?: string;
  retryUrl?: string;
  backText?: string;
  type?: 'warn' | 'error';
}

export default function Notice({
  title = 'Page Restricted',
  description = 'You do not have access to view this content',
  retryUrl = '/',
  backText = 'Go Back',
  type = 'warn',
}: NoticeProp) {
  let Icon;
  switch (type) {
    case 'error':
      Icon = AlertTriangle;
      break;
    case 'warn':
      Icon = AlertTriangle;
      break;
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4">
            <Icon className="h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
            <div className="mt-6 flex gap-3">
              <Link href="/">
                <Button variant="default">{backText}</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
