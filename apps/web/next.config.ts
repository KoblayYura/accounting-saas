import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl без i18n-роутингу: локаль з cookie (див. src/config/i18n/request.ts).
const withNextIntl = createNextIntlPlugin("./src/config/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    // Корінь монорепо містить власний package-lock.json, тож Turbopack інакше
    // вважає коренем проєкту Accounting/ і ламає резолв RSC-модулів.
    root: path.join(__dirname),
  },
};

export default withNextIntl(nextConfig);
