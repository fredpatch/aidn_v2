export const portalRoutes = {
  landing: "/",
  accountRequest: "/demande-compte",
  login: "/connexion",
  dashboard: "/tableau-de-bord",
  requests: "/demandes",
  newRequest: "/demandes/nouvelle",
  requestDetail: (id: string) => `/demandes/${id}`,
  rendezVous: "/rendez-vous",
  notifications: "/notifications",
} as const;
