// @ts-check
/** @param {import('@types/github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const comments = await github.rest.issues.listComments({
    issue_number: context.issue.number,
    repo: context.repo.repo,
    owner: context.repo.owner,
  })
  const body =
    "<table><tr><td><strong>Status:</strong><td>✅ Deploy successful!<tr><td><strong>BFF Preview URL:</strong><td><a href=https://bff-web-incmix-api.fly.dev/api/auth/reference>https://bff-web-incmix-api.fly.dev/api/auth/reference</a></table>"

  for (const c of comments.data) {
    const isDocs = c.body?.includes("BFF Preview URL")
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
