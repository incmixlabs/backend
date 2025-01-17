import { config } from "@jsprtmnn/utils/env"

export const emailSender = {
  send: async (apiKey: string, to: string, subject: string, html: string) => {
    return await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [
              {
                email: to,
              },
            ],
          },
        ],
        from: {
          email: config.notificationsEmail,
        },
        subject,
        content: [
          {
            type: "text/html",
            value: html,
          },
        ],
      }),
    })
  },
}
