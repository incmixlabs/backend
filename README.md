# Incmix API Monorepo

## The Tech stack is

### Client

- [x] pnpm
- [x] react
- [x] nextjs
- [x] zustand
- [x] tailwind
- [x] radix-ui and shadcn

### Server

- [x] pnpm
- [x] hono (Nodejs)
- [x] lucia auth
- [x] backend postgres (postgres)
- [x] Deployment (Flyio)

*Backend APIs*

| Endpoint       | Service      |
| -------------- | ------------ |
| *location-api* |              |
| weather        | tomorrow.io  |
| news           | serpapi.com  |
| ip location    | radar.io     |
| *auth-api*     |              |
| google auth    | google.com   |
| lucia auth     | lucia.io     |
| *email-api*    |              |
| email          | sendgrid.com |

## How to Run
1. Install Docker
2. Run ```docker compose up -d``` to start database containers
3. Run ```pnpm dev``` to start APIs