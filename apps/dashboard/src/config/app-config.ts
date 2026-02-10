import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "finterra",
  version: packageJson.version,
  copyright: `© ${currentYear}, finterra.`,
  meta: {
    title: "finterra - Dashboard",
    description:
      "finterra is a dashboard for managing your restaurant's tables and reservations.",
  },
};
