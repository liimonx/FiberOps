let started = false;

export async function startMockServiceWorker() {
  if (started) return;
  started = true;

  const { setupWorker } = await import("msw/browser");
  const { handlers } = await import("./handlers");

  const worker = setupWorker(...handlers);
  await worker.start({ onUnhandledRequest: "bypass" });
}

