import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="bg-background p-xl">
      <div className="gap-md flex items-center">
        <Button variant="secondary">Primary Action</Button>

        <Button variant="primary">Secondary</Button>

        <Button variant="ghost">Ghost Action</Button>
      </div>
    </main>
  );
}
