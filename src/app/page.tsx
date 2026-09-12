import { cn } from '@/lib/cn';

export default function Home() {
  return (
    <main className="bg-background p-xl text-foreground">
      <div className={cn('bg-primary px-sm py-sm text-on-primary', 'px-xl')}>Taskly</div>
    </main>
  );
}
