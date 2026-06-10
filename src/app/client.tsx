if (import.meta.env.DEV && import.meta.env.APP_ENV === "local") {
  await import("react-grab");
}

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
