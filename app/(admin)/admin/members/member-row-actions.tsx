"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setMemberRoleAction, setMemberStatusAction } from "./actions";

export function MemberRowActions({
  userId,
  role,
  status,
}: {
  userId: string;
  role: "ADMIN" | "MEMBER";
  status: "ACTIVE" | "DISABLED";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => startTransition(() => setMemberRoleAction(userId, role === "ADMIN" ? "MEMBER" : "ADMIN"))}
      >
        {role === "ADMIN" ? "Make member" : "Make admin"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(() => setMemberStatusAction(userId, status === "ACTIVE" ? "DISABLED" : "ACTIVE"))
        }
      >
        {status === "ACTIVE" ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}
