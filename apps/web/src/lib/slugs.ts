export const normalizeAppSlug = (rawValue: FormDataEntryValue | string | null): string => {
  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
};
