/** Admin sections – shared by the server page (access checks) and the client shell (navigation). */
export const ADMIN_NAV = [
  { id: "", de: "Übersicht", en: "Overview", perm: "content" },
  { id: "content", de: "Inhalte & Widgets", en: "Content & widgets", perm: "content" },
  { id: "design", de: "Design & Vorschau", en: "Design & preview", perm: "content" },
  { id: "media", de: "Medien", en: "Media", perm: "media" },
  { id: "messages", de: "Nachrichten", en: "Messages", perm: "messages" },
  { id: "stats", de: "Statistiken", en: "Statistics", perm: "stats" },
  { id: "users", de: "Benutzer", en: "Users", perm: "users" },
  { id: "system", de: "System & Backups", en: "System & backups", perm: "system" },
  { id: "account", de: "Mein Konto", en: "My account", perm: "content" },
] as const;
