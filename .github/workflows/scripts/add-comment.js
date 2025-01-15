// @ts-check
/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const comments = await github.rest.issues.listComments({
    issue_number: context.issue.number,
    repo: context.repo.repo,
    owner: context.repo.owner,
  })
  const body =
    "<table><tr><td><strong>Status:</strong><td>✅ Deploy successful!<tr><td><strong>Auth Preview URL:</strong><td><a href=https://auth-api-dev-prev.uincmix.workers.dev/api/auth/reference>https://auth-api-dev-prev.uincmix.workers.dev/api/auth/reference</a><tr><td><strong>Tasks Preview URL:</strong><td><a href=https://tasks-api-dev-prev.uincmix.workers.dev/api/tasks/reference>https://tasks-api-dev-prev.uincmix.workers.dev/api/tasks/reference</a><tr><td><strong>Files Preview URL:</strong><td><a href=https://fs-api-dev-prev.uincmix.workers.dev/api/files/reference>https://fs-api-dev-prev.uincmix.workers.dev/api/files/reference</a><tr><td><strong>Intl Preview URL:</strong><td><a href=https://intl-api-dev-prev.uincmix.workers.dev/api/intl/reference>https://intl-api-dev-prev.uincmix.workers.dev/api/intl/reference</a><tr><td><strong>Users Preview URL:</strong><td><a href=https://users-api-dev-prev.uincmix.workers.dev/api/users/reference>https://users-api-dev-prev.uincmix.workers.dev/api/users/reference</a><tr><td><strong>Orgs Preview URL:</strong><td><a href=https://org-api-dev-prev.uincmix.workers.dev/api/org/reference>https://org-api-dev-prev.uincmix.workers.dev/api/location/reference</a><tr><td><strong>Location Preview URL:</strong><td><a href=https://location-api-dev-prev.uincmix.workers.dev/api/location/reference>https://location-api-dev-prev.uincmix.workers.dev/api/location/reference</a></table>"

  for (const c of comments.data) {
    const isDocs = c.body?.includes("Auth Preview URL")
    if (isDocs) {
      await github.rest.issues.updateComment({
        repo: context.repo.repo,
        owner: context.repo.owner,
        comment_id: c.id,
        body,
      })
      return
    }
  }

  await github.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body,
  })
}
