import { Suspense } from "react";
import { Car } from "lucide-react";

import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Login",
  description: "Login ke sistem pembukuan kasir dan rental mobil",
};

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Car className="size-4" />
          </div>
          Pembukuan Kasir & List
        </a>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
