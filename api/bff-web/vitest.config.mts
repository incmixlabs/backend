// import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config"
// import tsconfigPaths from "vite-tsconfig-paths"
// import { authService, dummyService } from "./test/mocks"

// export default defineWorkersProject(() => {
//   return {
//     plugins: [tsconfigPaths()],
//     test: {
//       dir: "./test",
//       poolOptions: {
//         workers: {
//           singleWorker: true,
//           main: "./src/index.ts",
//           wrangler: {
//             configPath: "./wrangler.toml",
//             environment: "test",
//           },
//           miniflare: {
//             bindings: {
//               PORT: 8080,
//             },
//             serviceBindings: {
//               AUTH_API: authService,
//               TODO_API: dummyService,
//               USERS_API: dummyService,
//               ORG_API: dummyService,
//               INTL_API: dummyService,
//               FILES_API: dummyService,
//               EMAIL_API: dummyService,
//               LOCATION_API: dummyService,
//             },
//           },
//         },
//       },
//     },
//   }
// })
