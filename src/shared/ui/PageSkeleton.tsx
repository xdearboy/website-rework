export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
