export const plans = {
  free: {
    name: "Free",
    amount: 0,
    watchLimitSeconds: 5 * 60,
    dailyDownloads: 1,
  },
  bronze: {
    name: "Bronze",
    amount: 10,
    watchLimitSeconds: 7 * 60,
    dailyDownloads: Infinity,
  },
  silver: {
    name: "Silver",
    amount: 50,
    watchLimitSeconds: 10 * 60,
    dailyDownloads: Infinity,
  },
  gold: {
    name: "Gold",
    amount: 100,
    watchLimitSeconds: null,
    dailyDownloads: Infinity,
  },
};

export const paidPlanNames = ["bronze", "silver", "gold"];
