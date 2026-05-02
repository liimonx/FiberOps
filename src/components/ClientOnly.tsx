import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const hasMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}
