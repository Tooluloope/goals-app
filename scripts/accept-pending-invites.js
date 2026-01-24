#!/usr/bin/env node
// One-off helper: auto-accept all pending (non-expired) workspace invites when the invited user already exists.
// Usage: E2E_BASE_URL/.env DATABASE_URL must be set; run with `node scripts/accept-pending-invites.js`.

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();

  const invites = await prisma.workspaceInvite.findMany({
    where: {
      status: 'pending',
      expiresAt: { gt: now },
    },
    include: { workspace: true },
  });

  let accepted = 0;
  for (const invite of invites) {
    const user = await prisma.user.findUnique({ where: { email: invite.email } });
    if (!user) continue;

    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
    });

    await prisma.$transaction([
      membership
        ? prisma.workspaceInvite.update({
            where: { id: invite.id },
            data: { status: 'accepted', acceptedAt: new Date() },
          })
        : prisma.workspaceMember.create({
            data: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
          }),
      prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
    ]);

    accepted += 1;
    console.log(`Accepted invite ${invite.id} for ${invite.email} into ${invite.workspace.name}`);
  }

  console.log(`\nDone. Accepted ${accepted} pending invites.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
