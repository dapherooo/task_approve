import { prisma } from '../prisma/client';

export const userRepository = {
  findByNotionUserId: (notionUserId: string) => {
    return prisma.user.findUnique({ where: { notionUserId } });
  },

  findByTelegramId: (telegramId: string) => {
    return prisma.user.findUnique({ where: { telegramId } });
  },

  upsertUser: (data: {
    notionUserId: string;
    name: string | null;
    notionEmail: string | null;
    telegramId: string | null;
    employeeId: string | null;
  }) => {
    return prisma.user.upsert({
      where: { notionUserId: data.notionUserId },
      update: {
        name: data.name ?? '',
        notionEmail: data.notionEmail,
        telegramId: data.telegramId,
        employeeId: data.employeeId,
      },
      create: {
        notionUserId: data.notionUserId,
        name: data.name ?? '',
        notionEmail: data.notionEmail,
        telegramId: data.telegramId,
        employeeId: data.employeeId,
      },
    });
  },

  findAll: () => {
    return prisma.user.findMany();
  },
};
