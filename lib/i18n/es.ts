export const es = {
  nav: {
    dashboard: "Panel",
    competitions: "Competiciones",
    players: "Jugadores",
    clubs: "Clubes",
    login: "Entrar",
    create: "Crear competición",
  },
  formats: {
    AMERICANO: "Americano",
    MEXICANO: "Mexicano",
    ROUND_ROBIN: "Todos contra todos",
    SINGLE_ELIMINATION: "Eliminación simple",
    DOUBLE_ELIMINATION: "Eliminación doble",
    GROUPS_PLAYOFF: "Grupos + playoff",
    SINGLE_ROUND_ROBIN: "Liga ida",
    DOUBLE_ROUND_ROBIN: "Liga ida y vuelta",
  },
  statuses: {
    draft: "Borrador",
    registration: "Inscripción",
    ready: "Lista",
    live: "En vivo",
    finished: "Finalizada",
    cancelled: "Cancelada",
  },
  errors: {
    staleScore:
      "El marcador cambió en otro dispositivo. Hemos actualizado los datos; revisa y vuelve a guardar.",
    mexicanoHistorical:
      "Cambiar este resultado modificará la clasificación y eliminará/regenerará las rondas posteriores del Mexicano.",
  },
} as const;
