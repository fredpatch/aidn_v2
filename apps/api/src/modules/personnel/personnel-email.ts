const normalizeNamePart = (value?: string | null) =>
  (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const derivePersonnelEmail = (firstName?: string | null, lastName?: string | null): string | undefined => {
  const parts = [normalizeNamePart(firstName), normalizeNamePart(lastName)].filter(Boolean);

  if (parts.length === 0) {
    return undefined;
  }

  return `${parts.join(".")}@anac-gabon.com`;
};
