import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			environment: "jsdom",
			env: {
				VITE_SUPABASE_URL: "http://localhost:54321",
				VITE_SUPABASE_ANON_KEY: "test-anon-key",
			},
		},
	}),
);
