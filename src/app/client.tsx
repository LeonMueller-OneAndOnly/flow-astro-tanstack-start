const [{ StrictMode, startTransition }, { hydrateRoot }, { StartClient }] = await Promise.all([
  import("react"),
  import("react-dom/client"),
  import("@tanstack/react-start/client"),
]);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  );
});

export {};
