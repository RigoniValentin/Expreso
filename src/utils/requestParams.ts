export const getSingleParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export const getSingleNumberParam = (
  value: string | string[] | undefined,
  fallback = 0
): number => {
  const parsed = Number.parseInt(getSingleParam(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const objectIdToString = (
  value: { toString(): string } | string | null | undefined
): string => {
  if (!value) {
    return "";
  }

  return value.toString();
};
