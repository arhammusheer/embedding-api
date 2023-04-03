export const generateSlug = (name: string) => {
  const randomString = Math.random().toString(36).substring(2, 10);

  return `${name
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 -]/, "")
    .replace(/\s/g, "-")}--${randomString}`;
};
