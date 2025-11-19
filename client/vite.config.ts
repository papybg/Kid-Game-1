import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath, URL } from "url";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			// Allow imports like '@/utils/image-helpers' -> ./src/utils/image-helpers
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
});

