"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import notFound from "@data/content/not-found.json";

export default function NotFound() {
  const pathname = usePathname();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", pathname);
  }, [pathname]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{notFound.code}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{notFound.message}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {notFound.link}
        </a>
      </div>
    </div>
  );
}
