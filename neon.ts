import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  branch: (branch) => {
    if (branch.isDefault || branch.name === "test") {
      return {};
    }
    if (!branch.exists) {
      return { ttl: "30d" };
    }
    return {};
  },
});
