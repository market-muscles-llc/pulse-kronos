export default function Logo({ small, icon }: { small?: boolean; icon?: boolean }) {
  return (
    <h1 className="inline">
      <strong>
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="mx-auto w-8" alt="Move with Pulse" title="Move with Pulse" src="/pulse-icon.svg" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={small ? "h-8 w-auto" : "h-10 w-auto"}
            alt="Move with Pulse"
            title="Move with Pulse"
            src="/pulse-logo.svg"
          />
        )}
      </strong>
    </h1>
  );
}
