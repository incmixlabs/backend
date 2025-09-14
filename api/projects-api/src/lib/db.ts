import type { Project, Task } from "@incmix-api/utils/zod-schema"
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"
import type { Context } from "@/types"

export async function findRoleByName(c: Context, name: string, orgId: string) {
  const role = await c
    .get("db")
    .selectFrom("roles")
    .selectAll()
    .where((eb) => eb.and([eb("orgId", "=", orgId), eb("name", "=", name)]))
    .executeTakeFirst()

  if (!role) {
    const systemRole = await c
      .get("db")
      .selectFrom("roles")
      .selectAll()
      .where((eb) =>
        eb.and([eb("isSystemRole", "=", true), eb("name", "=", name)])
      )
      .executeTakeFirst()

    return systemRole
  }

  return role
}

export function buildProjectQuery(c: Context) {
  return c
    .get("db")
    .selectFrom("projects")
    .select((eb) => [
      "id",
      "name",
      "orgId",
      "createdAt",
      "updatedAt",
      "status",
      "startDate",
      "endDate",
      "budget",
      "company",
      "logo",
      "description",
      "checklist",
      jsonArrayFrom(
        eb
          .selectFrom("projectMembers")
          .innerJoin(
            "userProfiles as users",
            "projectMembers.userId",
            "users.id"
          )
          .select([
            "projectMembers.userId as id",
            "projectMembers.role",
            "projectMembers.isOwner",
            "users.fullName as name",
            "users.email",
            "users.avatar",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("members"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "in", "projects.createdBy")
      ).as("createdBy"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "in", "projects.updatedBy")
      ).as("updatedBy"),
    ])
}

export async function getProjectById(
  c: Context,
  projectId: string
): Promise<Project | undefined> {
  // const query = buildProjectQuery(c)
  const project = await c
    .get("db")
    .selectFrom("projects")
    .select((eb) => [
      "id",
      "name",
      "orgId",
      "createdAt",
      "updatedAt",
      "status",
      "startDate",
      "endDate",
      "budget",
      "company",
      "logo",
      "description",
      "checklist",
      "acceptanceCriteria",
      jsonArrayFrom(
        eb
          .selectFrom("projectMembers")
          .innerJoin(
            "userProfiles as users",
            "projectMembers.userId",
            "users.id"
          )
          .select([
            "projectMembers.userId as id",
            "projectMembers.role",
            "projectMembers.isOwner",
            "users.fullName as name",
            "users.email",
            "users.avatar",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("members"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "=", "projects.createdBy")
      ).as("createdBy"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles")
          .select(["id", "fullName", "email", "avatar"])
          .whereRef("id", "=", "projects.updatedBy")
      ).as("updatedBy"),
    ])
    .where("projects.id", "=", projectId)
    .executeTakeFirst()

  if (!project) return

  const createdBy = project.createdBy
  if (!createdBy) return

  const updatedBy = project.updatedBy
  if (!updatedBy) return

  return {
    ...project,
    members: project.members.flatMap((member) => {
      if (!member) return []

      return {
        id: member.id,
        role: member.role ?? "member",
        isOwner: member.isOwner,
        name: member.name,
        email: member.email,
        avatar: member.avatar,
      }
    }),
    createdBy: {
      id: createdBy.id,
      name: createdBy.fullName,
      image: createdBy.avatar ?? undefined,
    },
    updatedBy: {
      id: updatedBy.id,
      name: updatedBy.fullName,
      image: updatedBy.avatar ?? undefined,
    },
    progress:
      project.checklist.length > 0
        ? (100 * project.checklist.filter((c) => c.checked).length) /
          project.checklist.length
        : 0,
    timeLeft: "0d 0h 0m",
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    startDate: project.startDate?.toISOString(),
    endDate: project.endDate?.toISOString(),
  }
}

export async function createProject(
  c: Context,
  projectData: {
    id?: string
    name: string
    orgId: string
    description?: string
    status?: string
    startDate?: string
    endDate?: string
    company?: string
    budget?: number
    acceptanceCriteria?: string
    checklist?: string
    members?: string
    logo?: string
  },
  userId: string
) {
  // Generate unique ID for the project if not provided
  const projectId = projectData.id || crypto.randomUUID()

  // Check if a project with the same name already exists in the org
  const existingProject = await c
    .get("db")
    .selectFrom("projects")
    .select("id")
    .where((eb) =>
      eb.and([
        eb("orgId", "=", projectData.orgId),
        eb("name", "=", projectData.name),
      ])
    )
    .executeTakeFirst()

  if (existingProject) {
    throw new Error(
      `A project with the name "${projectData.name}" already exists in this organization`
    )
  }

  // Parse checklist if provided as string
  let checklistArray = []
  if (projectData.checklist) {
    try {
      checklistArray = JSON.parse(projectData.checklist)
    } catch {
      // If not valid JSON, treat as a single item
      checklistArray = [
        {
          id: crypto.randomUUID(),
          text: projectData.checklist,
          checked: false,
          order: 1,
          createdAt: new Date().toISOString(),
        },
      ]
    }
  }
  const db = c.get("db")
  // Create the project

  await db.transaction().execute(async (trx) => {
    // Create the project
    await trx
      .insertInto("projects")
      .values({
        id: projectId,
        name: projectData.name,
        orgId: projectData.orgId,
        description: projectData.description || "",
        status: (projectData.status as any) || "started",
        startDate: projectData.startDate || null,
        endDate: projectData.endDate || null,
        company: projectData.company || "",
        budget: projectData.budget || 0,
        logo: projectData.logo || "",
        acceptanceCriteria: projectData.acceptanceCriteria || "",
        checklist: JSON.stringify(checklistArray),
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .execute()

    // Add the creator as a project member with owner role
    await trx
      .insertInto("projectMembers")
      .values({
        projectId,
        userId,
        role: "owner",
        roleId: 1, // Owner role ID
        isOwner: true,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .execute()

    // Parse and add additional members if provided
    // Parse and add additional members if provided
    if (projectData.members) {
      try {
        const membersData = JSON.parse(projectData.members)
        if (Array.isArray(membersData) && membersData.length > 0) {
          // Filter out creator and duplicates
          const seen = new Set<string>()
          const additionalMembers = membersData.filter(
            (m: any) =>
              m.id &&
              m.id !== userId &&
              !seen.has(m.id) &&
              (seen.add(m.id), true)
          )
          // Validate each user exists and is org member
          for (const m of additionalMembers) {
            const user = await trx
              .selectFrom("userProfiles")
              .select("id")
              .where("id", "=", m.id)
              .executeTakeFirst()
            if (!user) throw new Error(`User ${m.id} not found`)
            const orgMember = await c
              .get("db")
              .selectFrom("members")
              .select("userId")
              .where((eb) =>
                eb.and([
                  eb("orgId", "=", projectData.orgId),
                  eb("userId", "=", m.id),
                ])
              )
              .executeTakeFirst()
            if (!orgMember)
              throw new Error(
                `User ${m.id} is not a member of org ${projectData.orgId}`
              )
          }
          if (additionalMembers.length > 0) {
            const membersToInsert = additionalMembers.map((member: any) => ({
              projectId,
              userId: member.id,
              role: (member.role || "member").toLowerCase(),
              roleId:
                (member.role || "member").toLowerCase() === "admin" ? 2 : 3,
              isOwner: false,
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }))
            await trx
              .insertInto("projectMembers")
              .values(membersToInsert)
              .execute()
          }
        }
      } catch (e) {
        // If members parsing fails, continue without adding additional members
        console.warn("Failed to parse members data:", e)
      }
    }
  })
  return {
    id: projectId,
    name: projectData.name,
    orgId: projectData.orgId,
  }
}

export async function updateProject(
  c: Context,
  projectId: string,
  updateData: {
    name?: string
    description?: string
    status?: string
    startDate?: string
    endDate?: string
    budget?: number
    company?: string
    logo?: string
    acceptanceCriteria?: string
  },
  userId: string
) {
  // Check if project exists
  const existingProject = await c
    .get("db")
    .selectFrom("projects")
    .select(["id", "name", "orgId"])
    .where("id", "=", projectId)
    .executeTakeFirst()

  if (!existingProject) {
    throw new Error("Project not found")
  }

  // If updating name, check for duplicates within the same org
  if (updateData.name && updateData.name !== existingProject.name) {
    const duplicateProject = await c
      .get("db")
      .selectFrom("projects")
      .select("id")
      .where((eb) =>
        eb.and([
          eb("orgId", "=", existingProject.orgId),
          eb("name", "=", updateData.name!),
          eb("id", "!=", projectId),
        ])
      )
      .executeTakeFirst()

    if (duplicateProject) {
      throw new Error(
        `A project with the name "${updateData.name}" already exists in this organization`
      )
    }
  }

  // Prepare update fields
  const updateFields: any = {
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  }

  if (updateData.name !== undefined) updateFields.name = updateData.name
  if (updateData.description !== undefined)
    updateFields.description = updateData.description
  if (updateData.status !== undefined) updateFields.status = updateData.status
  if (updateData.startDate !== undefined)
    updateFields.startDate = updateData.startDate || null
  if (updateData.endDate !== undefined)
    updateFields.endDate = updateData.endDate || null
  if (updateData.budget !== undefined) updateFields.budget = updateData.budget
  if (updateData.company !== undefined)
    updateFields.company = updateData.company
  if (updateData.logo !== undefined) updateFields.logo = updateData.logo
  if (updateData.acceptanceCriteria !== undefined)
    updateFields.acceptanceCriteria = updateData.acceptanceCriteria

  // Update the project
  await c
    .get("db")
    .updateTable("projects")
    .set(updateFields)
    .where("id", "=", projectId)
    .execute()

  return {
    success: true,
    message: "Project updated successfully",
  }
}

export async function deleteProject(c: Context, projectId: string) {
  // Check if project exists
  const existingProject = await c
    .get("db")
    .selectFrom("projects")
    .select("id")
    .where("id", "=", projectId)
    .executeTakeFirst()

  if (!existingProject) {
    throw new Error("Project not found")
  }

  // Start a transaction to ensure all deletions are atomic
  // Note: If Kysely transaction support is not available, perform deletions in order

  // 1. Delete task assignments for all tasks in the project
  const db = c.get("db")
  await db.transaction().execute(async (trx) => {
    // 1. Delete task assignments for all tasks in the project
    await trx
      .deleteFrom("taskAssignments")
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom("tasks")
            .select("tasks.id")
            .whereRef("tasks.id", "=", "taskAssignments.taskId")
            .where("tasks.projectId", "=", projectId)
        )
      )
      .execute()

    // 2. Delete all tasks in the project
    await trx.deleteFrom("tasks").where("projectId", "=", projectId).execute()

    // 3. Delete all project members
    await trx
      .deleteFrom("projectMembers")
      .where("projectId", "=", projectId)
      .execute()

    // 4. Delete the project itself
    await trx.deleteFrom("projects").where("id", "=", projectId).execute()
  })
  return {
    success: true,
    message: "Project and all related data deleted successfully",
  }
}

export async function getUserProjects(
  c: Context,
  memberId: string,
  orgId: string
) {
  const projects = await c
    .get("db")
    .selectFrom("projects")
    .select((eb) => [
      "projects.id",
      "projects.name",
      "projects.orgId",
      "projects.createdAt",
      "projects.updatedAt",
      "projects.status",
      "projects.startDate",
      "projects.endDate",
      "projects.budget",
      "projects.company",
      "projects.logo",
      "projects.description",
      "projects.checklist",
      "projects.acceptanceCriteria",
      jsonArrayFrom(
        eb
          .selectFrom("projectMembers")
          .innerJoin(
            "userProfiles as users",
            "projectMembers.userId",
            "users.id"
          )
          .select([
            "projectMembers.userId as id",
            "users.fullName as name",
            "users.email",
            "users.avatar",
          ])
          .whereRef("projectId", "=", "projects.id")
      ).as("members"),
    ])
    .innerJoin("projectMembers", "projects.id", "projectMembers.projectId")
    .where((eb) =>
      eb.and([
        eb("projectMembers.userId", "=", memberId),
        eb("projects.orgId", "=", orgId),
      ])
    )
    .execute()

  return projects.map((project) => ({
    ...project,
    progress:
      project.checklist.length > 0
        ? (100 * project.checklist.filter((c) => c.checked).length) /
          project.checklist.length
        : 0,
    timeLeft: "0d 0h 0m",
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    startDate: project.startDate?.toISOString(),
  }))
}

export async function isOrgMember(c: Context, orgId: string, userId: string) {
  const member = await c
    .get("db")
    .selectFrom("members")
    .selectAll()
    .where((eb) => eb.and([eb("orgId", "=", orgId), eb("userId", "=", userId)]))
    .executeTakeFirst()

  return !!member
}

export async function getProjectMembers(c: Context, projectId: string) {
  const members = await c
    .get("db")
    .selectFrom("projectMembers")
    .innerJoin("userProfiles as users", "projectMembers.userId", "users.id")
    .select([
      "projectMembers.userId as id",
      "projectMembers.role",
      "projectMembers.isOwner",
      "users.fullName as name",
      "users.email",
      "users.avatar",
    ])
    .where("projectMembers.projectId", "=", projectId)
    .execute()

  return members.map((member) => ({
    id: member.id,
    role: member.role ?? "member",
    isOwner: member.isOwner,
    name: member.name,
    email: member.email,
    avatar: member.avatar,
  }))
}

export async function isProjectMember(
  c: Context,
  projectId: string,
  userId: string
) {
  const member = await c
    .get("db")
    .selectFrom("projectMembers")
    .selectAll()
    .where((eb) =>
      eb.and([eb("projectId", "=", projectId), eb("userId", "=", userId)])
    )
    .executeTakeFirst()

  return !!member
}

export async function addProjectMembers(
  c: Context,
  projectId: string,
  members: { id: string; role?: string }[],
  userId: string
) {
  // First validate that all users exist and are org members
  const project = await getProjectById(c, projectId)
  if (!project) {
    throw new Error("Project not found")
  }

  // Check each member exists and is an org member
  for (const member of members) {
    const userExists = await c
      .get("db")
      .selectFrom("userProfiles")
      .select("id")
      .where("id", "=", member.id)
      .executeTakeFirst()

    if (!userExists) {
      throw new Error(`User ${member.id} not found`)
    }

    const isOrgMemberCheck = await isOrgMember(c, project.orgId, member.id)
    if (!isOrgMemberCheck) {
      throw new Error(
        `User ${member.id} is not a member of organization ${project.orgId}`
      )
    }

    // Check if user is already a project member
    const existingMember = await isProjectMember(c, projectId, member.id)
    if (existingMember) {
      throw new Error(`User ${member.id} is already a member of this project`)
    }
  }

  // Add all members to the project
  // Map role names to roleIds (similar to org-api)
  // 1 = owner, 2 = admin, 3 = member
  const getRoleId = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return 1
      case "admin":
        return 2
      default:
        return 3
    }
  }

  const membersToInsert = members.map((member) => ({
    projectId,
    userId: member.id,
    role: member.role || "member",
    roleId: getRoleId(member.role || "member"),
    isOwner: false,
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))

  await c
    .get("db")
    .insertInto("projectMembers")
    .values(membersToInsert)
    .execute()

  return {
    success: true,
    message: `Added ${members.length} members to project`,
  }
}

export async function removeProjectMembers(
  c: Context,
  projectId: string,
  memberIds: string[]
) {
  // Validate that all memberIds exist in the project
  for (const memberId of memberIds) {
    const existingMember = await c
      .get("db")
      .selectFrom("projectMembers")
      .select(["userId", "isOwner"])
      .where((eb) =>
        eb.and([eb("projectId", "=", projectId), eb("userId", "=", memberId)])
      )
      .executeTakeFirst()

    if (!existingMember) {
      throw new Error(`User ${memberId} is not a member of this project`)
    }
  }

  // Check if we're trying to remove all owners
  const owners = await c
    .get("db")
    .selectFrom("projectMembers")
    .select("userId")
    .where((eb) =>
      eb.and([eb("projectId", "=", projectId), eb("isOwner", "=", true)])
    )
    .execute()

  const remainingOwners = owners.filter(
    (owner) => !memberIds.includes(owner.userId)
  )

  if (remainingOwners.length === 0) {
    throw new Error(
      "Cannot remove all owners from project. At least one owner must remain."
    )
  }

  // Remove the members from the project
  await c
    .get("db")
    .deleteFrom("projectMembers")
    .where((eb) =>
      eb.and([eb("projectId", "=", projectId), eb("userId", "in", memberIds)])
    )
    .execute()

  return {
    success: true,
    message: `Removed ${memberIds.length} members from project`,
  }
}

export async function addProjectChecklistItem(
  c: Context,
  projectId: string,
  checklistItem: { text: string; checked?: boolean; order?: number }
) {
  // Get current project to access existing checklist
  const project = await c
    .get("db")
    .selectFrom("projects")
    .select(["checklist"])
    .where("id", "=", projectId)
    .executeTakeFirst()

  if (!project) {
    throw new Error("Project not found")
  }

  // Generate unique ID for the checklist item
  const itemId = crypto.randomUUID()

  // Create new checklist item
  const newItem = {
    id: itemId,
    text: checklistItem.text,
    checked: checklistItem.checked ?? false,
    order: checklistItem.order ?? project.checklist.length + 1,
    createdAt: new Date().toISOString(),
  }

  // Add item to existing checklist
  const updatedChecklist = [...project.checklist, newItem]

  // Update project with new checklist and timestamp
  await c
    .get("db")
    .updateTable("projects")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
    })
    .where("id", "=", projectId)
    .execute()

  return {
    success: true,
    message: "Checklist item added successfully",
    item: newItem,
  }
}

export async function updateProjectChecklistItem(
  c: Context,
  projectId: string,
  checklistId: string,
  updateData: { text?: string; checked?: boolean; order?: number }
) {
  // Get current project to access existing checklist
  const project = await c
    .get("db")
    .selectFrom("projects")
    .select(["checklist"])
    .where("id", "=", projectId)
    .executeTakeFirst()

  if (!project) {
    throw new Error("Project not found")
  }

  // Find the checklist item to update
  const checklistItemIndex = project.checklist.findIndex(
    (item) => item.id === checklistId
  )
  if (checklistItemIndex === -1) {
    throw new Error("Checklist item not found")
  }

  // Update the checklist item
  const updatedChecklist = [...project.checklist]
  const existingItem = updatedChecklist[checklistItemIndex]

  updatedChecklist[checklistItemIndex] = {
    ...existingItem,
    text: updateData.text ?? existingItem.text,
    checked: updateData.checked ?? existingItem.checked,
    order: updateData.order ?? existingItem.order,
  }

  // Update project with modified checklist and timestamp
  await c
    .get("db")
    .updateTable("projects")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
    })
    .where("id", "=", projectId)
    .execute()

  return {
    success: true,
    message: "Checklist item updated successfully",
    item: updatedChecklist[checklistItemIndex],
  }
}

export async function removeProjectChecklistItems(
  c: Context,
  projectId: string,
  checklistIds: string[]
) {
  // Get current project to access existing checklist
  const project = await c
    .get("db")
    .selectFrom("projects")
    .select(["checklist"])
    .where("id", "=", projectId)
    .executeTakeFirst()

  if (!project) {
    throw new Error("Project not found")
  }

  // Validate that all checklist IDs exist
  const existingIds = project.checklist.map((item) => item.id)
  const nonExistentIds = checklistIds.filter((id) => !existingIds.includes(id))

  if (nonExistentIds.length > 0) {
    throw new Error(`Checklist items not found: ${nonExistentIds.join(", ")}`)
  }

  // Filter out the checklist items to be removed
  const updatedChecklist = project.checklist.filter(
    (item) => !checklistIds.includes(item.id)
  )

  // Update project with filtered checklist and timestamp
  await c
    .get("db")
    .updateTable("projects")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
    })
    .where("id", "=", projectId)
    .execute()

  return {
    success: true,
    message: `Successfully removed ${checklistIds.length} checklist item${checklistIds.length === 1 ? "" : "s"}`,
    removedCount: checklistIds.length,
  }
}

export async function getTaskById(c: Context, taskId: string) {
  const task = await buildTaskQuery(c)
    .where("tasks.id", "=", taskId)
    .executeTakeFirst()

  if (!task) return null

  const _createdBy = task.createdBy
  const _updatedBy = task.updatedBy
  const _assignedTo = task.assignedTo

  const createdBy = task.createdBy
  const updatedBy = task.updatedBy
  const assignedTo = task.assignedTo ?? []

  if (createdBy && updatedBy)
    return {
      ...task,
      createdBy: {
        id: createdBy.id,
        name: createdBy.name,
        image: createdBy.image ?? undefined,
      },
      updatedBy: {
        id: updatedBy.id,
        name: updatedBy.name,
        image: updatedBy.image ?? undefined,
      },
      assignedTo: assignedTo.map((a) => ({
        id: a.id,
        name: a.name,
        image: a.image ?? undefined,
      })),
      createdAt: task.createdAt.getTime(),
      updatedAt: task.updatedAt.getTime(),
      startDate: task.startDate?.getTime(),
      endDate: task.endDate?.getTime(),
      isSubtask: task.parentTaskId !== null,
      comments: [],
    }

  return null
}

export async function getTasks(c: Context, userId: string): Promise<Task[]> {
  const tasksQuery = buildTaskQuery(c)

  const _tasks = await buildTaskQuery(c)
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom("taskAssignments")
          .select("taskAssignments.taskId")
          .whereRef("taskAssignments.taskId", "=", "tasks.id")
          .where("taskAssignments.userId", "=", userId)
      )
    )
    .execute()
  const tasks = await tasksQuery.execute()

  return tasks.flatMap((task) => {
    const createdBy = task.createdBy
    const updatedBy = task.updatedBy
    const assignedTo = task.assignedTo ?? []

    if (createdBy && updatedBy)
      return {
        ...task,
        createdBy: {
          id: createdBy.id,
          name: createdBy.name,
          image: createdBy.image ?? undefined,
        },
        updatedBy: {
          id: updatedBy.id,
          name: updatedBy.name,
          image: updatedBy.image ?? undefined,
        },
        assignedTo: assignedTo.map((a) => ({
          id: a.id,
          name: a.name,
          image: a.image ?? undefined,
        })),
        createdAt: task.createdAt.getTime(),
        updatedAt: task.updatedAt.getTime(),
        startDate: task.startDate?.getTime(),
        endDate: task.endDate?.getTime(),
        isSubtask: task.parentTaskId !== null,
        comments: [],
      }

    return []
  })
}

export async function createTask(
  c: Context,
  taskData: {
    projectId: string
    name: string
    description?: string
    taskOrder?: number
    assignedTo?: string[]
    startDate?: string
    endDate?: string
    parentTaskId?: string
    statusId?: string
    priorityId?: string
    labelsTags?: string[]
    refUrls?: object[]
    attachments?: object[]
    acceptanceCriteria?: object[]
    checklist?: object[]
  },
  userId: string
) {
  // Generate unique ID for the task
  const taskId = crypto.randomUUID()

  // Create the task
  await c
    .get("db")
    .insertInto("tasks")
    .values({
      id: taskId,
      name: taskData.name,
      description: taskData.description || "",
      taskOrder: taskData.taskOrder || 0,
      projectId: taskData.projectId,
      statusId: taskData.statusId || "",
      priorityId: taskData.priorityId || "",
      startDate: taskData.startDate || null,
      endDate: taskData.endDate || null,
      parentTaskId: taskData.parentTaskId || null,
      acceptanceCriteria: JSON.stringify(taskData.acceptanceCriteria || []),
      checklist: JSON.stringify(taskData.checklist || []),
      refUrls: JSON.stringify(taskData.refUrls || []),
      labelsTags: JSON.stringify(taskData.labelsTags || []),
      attachments: JSON.stringify(taskData.attachments || []),
      completed: false,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .execute()

  // Handle task assignments if provided
  if (taskData.assignedTo && taskData.assignedTo.length > 0) {
    const assignments = taskData.assignedTo.map((assigneeId) => ({
      taskId,
      userId: assigneeId,
      assignedAt: new Date(),
    }))

    await c
      .get("db")
      .insertInto("taskAssignments")
      .values(assignments)
      .execute()
  }

  return {
    success: true,
    message: "Task created successfully",
    taskId,
    name: taskData.name,
  }
}

export async function updateTask(
  c: Context,
  taskId: string,
  updateData: {
    name?: string
    description?: string
    taskOrder?: number
    statusId?: string
    priorityId?: string
    startDate?: string
    endDate?: string
    parentTaskId?: string
    labelsTags?: string[]
    refUrls?: object[]
    attachments?: object[]
    acceptanceCriteria?: object[]
    assignedTo?: string[]
  },
  userId: string
) {
  // Check if task exists
  const existingTask = await c
    .get("db")
    .selectFrom("tasks")
    .select("id")
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!existingTask) {
    throw new Error("Task not found")
  }

  // Prepare update data
  const updateFields: any = {
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  }

  if (updateData.name !== undefined) updateFields.name = updateData.name
  if (updateData.description !== undefined)
    updateFields.description = updateData.description
  if (updateData.taskOrder !== undefined)
    updateFields.taskOrder = updateData.taskOrder
  if (updateData.statusId !== undefined)
    updateFields.statusId = updateData.statusId
  if (updateData.priorityId !== undefined)
    updateFields.priorityId = updateData.priorityId
  if (updateData.startDate !== undefined)
    updateFields.startDate = updateData.startDate
      ? new Date(updateData.startDate)
      : null
  if (updateData.endDate !== undefined)
    updateFields.endDate = updateData.endDate
      ? new Date(updateData.endDate)
      : null
  if (updateData.parentTaskId !== undefined)
    updateFields.parentTaskId = updateData.parentTaskId
  if (updateData.labelsTags !== undefined)
    updateFields.labelsTags = JSON.stringify(updateData.labelsTags)
  if (updateData.refUrls !== undefined)
    updateFields.refUrls = JSON.stringify(updateData.refUrls)
  if (updateData.attachments !== undefined)
    updateFields.attachments = JSON.stringify(updateData.attachments)
  if (updateData.acceptanceCriteria !== undefined)
    updateFields.acceptanceCriteria = JSON.stringify(
      updateData.acceptanceCriteria
    )

  // Update the task
  await c
    .get("db")
    .updateTable("tasks")
    .set(updateFields)
    .where("id", "=", taskId)
    .execute()

  // Handle assignment updates if provided
  if (updateData.assignedTo !== undefined) {
    // Remove existing assignments
    await c
      .get("db")
      .deleteFrom("taskAssignments")
      .where("taskId", "=", taskId)
      .execute()

    // Add new assignments
    if (updateData.assignedTo.length > 0) {
      const assignments = updateData.assignedTo.map((assigneeId) => ({
        taskId,
        userId: assigneeId,
        assignedAt: new Date(),
      }))

      await c
        .get("db")
        .insertInto("taskAssignments")
        .values(assignments)
        .execute()
    }
  }

  return {
    success: true,
    message: "Task updated successfully",
  }
}

export async function deleteTask(c: Context, taskId: string) {
  // Check if task exists
  const existingTask = await c
    .get("db")
    .selectFrom("tasks")
    .select("id")
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!existingTask) {
    throw new Error("Task not found")
  }

  // Delete task assignments first (foreign key constraint)
  await c
    .get("db")
    .deleteFrom("taskAssignments")
    .where("taskId", "=", taskId)
    .execute()

  // Delete the task
  await c.get("db").deleteFrom("tasks").where("id", "=", taskId).execute()

  return {
    success: true,
    message: "Task deleted successfully",
  }
}

export async function addTaskChecklistItem(
  c: Context,
  taskId: string,
  checklistItem: { text: string; checked?: boolean; order?: number }
) {
  // Get current task to access existing checklist
  const task = await c
    .get("db")
    .selectFrom("tasks")
    .select(["checklist"])
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  // Generate unique ID for the checklist item
  const itemId = crypto.randomUUID()

  // Create new checklist item
  const newItem = {
    id: itemId,
    text: checklistItem.text,
    checked: checklistItem.checked ?? false,
    order: checklistItem.order ?? task.checklist.length + 1,
    createdAt: new Date().toISOString(),
  }

  // Add item to existing checklist
  const updatedChecklist = [...task.checklist, newItem]

  // Update task with new checklist and timestamp
  await c
    .get("db")
    .updateTable("tasks")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
    })
    .where("id", "=", taskId)
    .execute()

  return {
    success: true,
    message: "Checklist item added successfully",
    item: newItem,
  }
}

export async function updateTaskChecklistItem(
  c: Context,
  taskId: string,
  checklistId: string,
  updateData: { text?: string; checked?: boolean; order?: number }
) {
  // Get current task to access existing checklist
  const task = await c
    .get("db")
    .selectFrom("tasks")
    .select(["checklist"])
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  // Find the checklist item to update
  const checklistItemIndex = task.checklist.findIndex(
    (item) => item.id === checklistId
  )
  if (checklistItemIndex === -1) {
    throw new Error("Checklist item not found")
  }

  // Update the checklist item
  const updatedChecklist = [...task.checklist]
  const existingItem = updatedChecklist[checklistItemIndex]

  updatedChecklist[checklistItemIndex] = {
    ...existingItem,
    text: updateData.text ?? existingItem.text,
    checked: updateData.checked ?? existingItem.checked,
    order: updateData.order ?? existingItem.order,
  }

  // Update task with modified checklist and timestamp
  await c
    .get("db")
    .updateTable("tasks")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
    })
    .where("id", "=", taskId)
    .execute()

  return {
    success: true,
    message: "Checklist item updated successfully",
    item: updatedChecklist[checklistItemIndex],
  }
}

export async function removeTaskChecklistItems(
  c: Context,
  taskId: string,
  checklistIds: string[]
) {
  // Get current task to access existing checklist
  const task = await c
    .get("db")
    .selectFrom("tasks")
    .select(["checklist"])
    .where("id", "=", taskId)
    .executeTakeFirst()

  if (!task) {
    throw new Error("Task not found")
  }

  // Validate that all checklist IDs exist
  const existingIds = task.checklist.map((item) => item.id)
  const nonExistentIds = checklistIds.filter((id) => !existingIds.includes(id))

  if (nonExistentIds.length > 0) {
    throw new Error(`Checklist items not found: ${nonExistentIds.join(", ")}`)
  }

  // Filter out the checklist items to be removed
  const updatedChecklist = task.checklist.filter(
    (item) => !checklistIds.includes(item.id)
  )

  // Update task with filtered checklist and timestamp
  await c
    .get("db")
    .updateTable("tasks")
    .set({
      checklist: JSON.stringify(updatedChecklist),
      updatedAt: new Date().toISOString(),
    })
    .where("id", "=", taskId)
    .execute()

  return {
    success: true,
    message: `Successfully removed ${checklistIds.length} checklist item${checklistIds.length === 1 ? "" : "s"}`,
    removedCount: checklistIds.length,
  }
}

function buildTaskQuery(c: Context) {
  return c
    .get("db")
    .selectFrom("tasks")
    .select((eb) => [
      "tasks.id",
      "tasks.name",
      "tasks.description",
      "tasks.taskOrder",
      "tasks.createdAt",
      "tasks.updatedAt",
      "tasks.projectId",
      "tasks.statusId",
      "tasks.priorityId",
      "tasks.startDate",
      "tasks.endDate",
      "tasks.acceptanceCriteria",
      "tasks.checklist",
      "tasks.refUrls",
      "tasks.labelsTags",
      "tasks.attachments",
      "tasks.parentTaskId",
      "tasks.completed",
      jsonArrayFrom(
        eb
          .selectFrom("tasks as st")
          .select([
            "st.id",
            "st.taskOrder",
            "st.name",
            "st.description",
            "st.completed",
          ])
          .whereRef("tasks.id", "=", "tasks.parentTaskId")
      ).as("subTasks"),
      jsonArrayFrom(
        eb
          .selectFrom("taskAssignments")
          .innerJoin("userProfiles as up", "taskAssignments.userId", "up.id")
          .select(["up.id", "up.fullName as name", "up.avatar as image"])
          .whereRef("taskAssignments.taskId", "=", "tasks.id")
      ).as("assignedTo"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles as up2")
          .select(["up2.id", "up2.fullName as name", "up2.avatar as image"])
          .whereRef("up2.id", "=", "tasks.createdBy")
      ).as("createdBy"),
      jsonObjectFrom(
        eb
          .selectFrom("userProfiles as up3")
          .select(["up3.id", "up3.fullName as name", "up3.avatar as image"])
          .whereRef("up3.id", "=", "tasks.updatedBy")
      ).as("updatedBy"),
    ])
}
