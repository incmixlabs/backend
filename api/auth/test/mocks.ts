// import {
//   type Miniflare,
//   type Request,
//   type RequestInitCfType,
//   Response,
// } from "miniflare"

// export const emailService = async (
//   _req: Request<RequestInitCfType>,
//   mf: Miniflare
// ) => {
//   await mf.ready
//   return Response.json({ message: "Mail sent" }, { status: 200 })
// }
// export const usersService = async (
//   _req: Request<RequestInitCfType>,
//   mf: Miniflare
// ) => {
//   await mf.ready
//   return Response.json(
//     { fullName: "John Doe", email: "john.doe@example.com", localeId: 1 },
//     { status: 200 }
//   )
// }

// export const filesService = async (
//   req: Request<RequestInitCfType>,
//   mf: Miniflare
// ) => {
//   await mf.ready
//   const url = new URL(req.url)
//   const method = req.method

//   if (method === "PUT" && url.pathname.endsWith("/upload")) {
//     const fileName = url.searchParams.get("fileName")
//     if (!fileName) {
//       return Response.json(
//         { message: "File name is required" },
//         { status: 400 }
//       )
//     }
//     const file = await req.arrayBuffer()

//     if (!file) {
//       return Response.json({ message: "No file found" }, { status: 400 })
//     }

//     const cookies = req.headers.get("cookie")
//     if (!cookies) {
//       return Response.json({ message: "No cookies found" }, { status: 400 })
//     }
//     const userId = cookies
//       .split(";")
//       .find((c) => c.trim().startsWith("userId="))
//       ?.split("=")[1]
//     if (!userId) {
//       return Response.json(
//         { message: "UserId not found in cookies" },
//         { status: 400 }
//       )
//     }

//     // Update the user's profile_image in the database
//     await (await mf.getD1Database("DB"))
//       .prepare("UPDATE users SET profile_image = ? WHERE id = ?")
//       .bind(`profile_image/${userId}.jpg`, userId)
//       .run()

//     // Verify the operation was successful
//     const result = await (await mf.getD1Database("DB"))
//       .prepare("SELECT * FROM users WHERE id = ?")
//       .bind(userId)
//       .first()

//     return Response.json({ message: "File uploaded", result }, { status: 200 })
//   }

//   if (method === "DELETE" && url.pathname.endsWith("/delete")) {
//     const cookies = req.headers.get("cookie")
//     if (!cookies) {
//       return Response.json({ message: "No cookies found" }, { status: 400 })
//     }
//     const userId = cookies
//       .split(";")
//       .find((c) => c.trim().startsWith("userId="))
//       ?.split("=")[1]
//     if (!userId) {
//       return Response.json(
//         { message: "UserId not found in cookies" },
//         { status: 400 }
//       )
//     }

//     // Remove the user's profile_image from the database
//     await (await mf.getD1Database("DB"))
//       .prepare("UPDATE users SET profile_image = NULL WHERE id = ?")
//       .bind(userId)
//       .run()

//     return Response.json({ message: "File deleted" }, { status: 200 })
//   }

//   if (method === "GET" && url.pathname.endsWith("/presigned-upload")) {
//     const fileName = url.searchParams.get("fileName")
//     if (!fileName) {
//       return Response.json(
//         { message: "File name is required" },
//         { status: 400 }
//       )
//     }
//     const localUrl = `http://127.0.0.1:8282/api/files/upload?fileName=${encodeURIComponent(fileName)}`
//     return Response.json({ url: localUrl }, { status: 200 })
//   }

//   if (method === "GET" && url.pathname.endsWith("/presigned-download")) {
//     const fileName = url.searchParams.get("fileName")
//     if (!fileName) {
//       return Response.json(
//         { message: "File name is required" },
//         { status: 400 }
//       )
//     }
//     const localUrl = `http://127.0.0.1:8282/api/files/download?fileName=${encodeURIComponent(fileName)}`
//     return Response.json({ url: localUrl }, { status: 200 })
//   }

//   if (method === "GET" && url.pathname.endsWith("/presigned-delete")) {
//     const fileName = url.searchParams.get("fileName")
//     if (!fileName) {
//       return Response.json(
//         { message: "File name is required" },
//         { status: 400 }
//       )
//     }
//     const localUrl = `http://127.0.0.1:8282/api/files/delete?fileName=${encodeURIComponent(fileName)}`
//     return Response.json({ url: localUrl }, { status: 200 })
//   }

//   return Response.json({ message: "Not found" }, { status: 404 })
// }

// export const intlService = async (
//   req: Request<RequestInitCfType>,
//   mf: Miniflare
// ) => {
//   await mf.ready
//   const url = new URL(req.url)
//   if (url.pathname.endsWith("locales/default"))
//     return Response.json({ code: "en", is_default: true }, { status: 200 })

//   return Response.json([], { status: 200 })
// }

// // export const defaultMessages = [
// //   {
// //     key: "errors.invalid_credentials",
// //     value: "errors.invalid_credentials",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.presigned_url",
// //     value: "errors.presigned_url",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.wrong_password",
// //     value: "errors.wrong_password",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.unauthorized",
// //     value: "errors.unauthorized",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.user_not_found",
// //     value: "errors.user_not_found",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.server_error",
// //     value: "errors.server_error",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.bad_request",
// //     value: "errors.bad_request",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.already_registered",
// //     value: "errors.already_registered",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.invalid_code",
// //     value: "errors.invalid_code",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.upload_fail",
// //     value: "errors.upload_fail",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.no_pp",
// //     value: "errors.no_pp",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.pp_delete_fail",
// //     value: "errors.pp_delete_fail",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.pp_fetch_fail",
// //     value: "errors.pp_fetch_fail",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.org_exist",
// //     value: "errors.org_exist",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.org_not_found",
// //     value: "errors.org_not_found",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.role_not_found",
// //     value: "errors.role_not_found",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.org_create_fail",
// //     value: "errors.org_create_fail",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.org_update_fail",
// //     value: "errors.org_update_fail",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.org_delete_fail",
// //     value: "errors.org_delete_fail",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.member_exist",
// //     value: "errors.member_exist",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "errors.member_insert_fail",
// //     value: "errors.member_insert_fail",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.logout_success",
// //     value: "auth.logout_success",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.user_deleted",
// //     value: "auth.user_deleted",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.pp_updated",
// //     value: "auth.pp_updated",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.pp_deleted",
// //     value: "auth.pp_deleted",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.email_already_verified",
// //     value: "auth.email_already_verified",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.verify_success",
// //     value: "auth.verify_success",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.mail_sent",
// //     value: "auth.mail_sent",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.pass_reset_success",
// //     value: "auth.pass_reset_success",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "auth.org_delete_success",
// //     value: "auth.org_delete_success",
// //     type: "label",
// //     locale: "en",
// //   },
// //   {
// //     key: "email.mail_sent",
// //     value: "email.mail_sent",
// //     type: "label",
// //     locale: "en",
// //   },
// // ]
