export function compactAddress(
  value: string | null | undefined,
  start = 7,
  end = 5,
) {
  if (!value) return "—";
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}

export function formatAmount(
  value: string | number | null | undefined,
  decimals = 6,
  digits = 2,
) {
  if (value === null || value === undefined) return "—";
  try {
    const raw = BigInt(value);
    const divisor = 10n ** BigInt(decimals);
    const whole = raw / divisor;
    const fractional = raw % divisor;
    const rounded =
      digits < decimals
        ? (fractional + 10n ** BigInt(decimals - digits) / 2n) /
          10n ** BigInt(decimals - digits)
        : fractional;
    const carry = rounded >= 10n ** BigInt(digits) && digits < decimals;
    const wholeText = (whole + (carry ? 1n : 0n))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const fractionText =
      carry || digits === 0
        ? ""
        : rounded.toString().padStart(digits, "0").replace(/0+$/, "");
    return fractionText ? `${wholeText}.${fractionText}` : wholeText;
  } catch {
    return "—";
  }
}

export function formatCount(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const number = Number(value);
  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-US").format(number)
    : "—";
}

export function formatDate(seconds: string | number | null | undefined) {
  if (!seconds || Number(seconds) <= 0) return "—";
  return new Date(Number(seconds) * 1000).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function relativeTime(seconds: string | number | null | undefined) {
  if (!seconds || Number(seconds) <= 0) return "—";
  const delta = Date.now() - Number(seconds) * 1000;
  const minutes = Math.max(0, Math.floor(delta / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
