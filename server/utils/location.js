const southernStates = new Set([
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
]);

export const isSouthernState = (state = "") =>
  southernStates.has(state.trim().toLowerCase());
