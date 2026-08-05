import { Spinner } from "@/components/ui/spinner";

// The proxy redirects "/" to /dashboard (signed in) or /login (signed out)
// before this renders; the spinner is just a fallback.
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  );
}

