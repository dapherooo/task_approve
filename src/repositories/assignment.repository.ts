import { prisma } from '../prisma/client';
import { AssignmentStatus } from '@prisma/client';
import { CreateAssignmentData } from '../types/notion.types';

export const assignmentRepository = {
  findByWpId: (wpId: string) => {
    return prisma.assignment.findFirst({
      where: { wpId },
      include: { pm: true, assignee: true },
      orderBy: { assignedAt: 'desc' },
    });
  },

  findById: (id: number) => {
    return prisma.assignment.findUnique({
      where: { id },
      include: { pm: true, assignee: true },
    });
  },

  create: (data: CreateAssignmentData) => {
    return prisma.assignment.create({
      data,
      include: { pm: true, assignee: true },
    });
  },

  updateStatus: (id: number, status: AssignmentStatus) => {
    return prisma.assignment.update({
      where: { id },
      data: { status },
    });
  },

  createPMLog: (data: { assignmentId: number; message: string }) => {
    return prisma.pMLog.create({ data });
  },

  createAssigneeLog: (data: { assignmentId: number; message: string }) => {
    return prisma.assigneeLog.create({ data });
  },

  findAssigneeLog: (assignmentId: number) => {
    return prisma.assigneeLog.findUnique({ where: { assignmentId } });
  },

  updateAssigneeLog: (
    assignmentId: number,
    data: { respond: string; respondAt: Date },
  ) => {
    return prisma.assigneeLog.update({
      where: { assignmentId },
      data,
    });
  },

  updateAssigneeLogReason: (assignmentId: number, reasonRejection: string) => {
    return prisma.assigneeLog.update({
      where: { assignmentId },
      data: { reasonRejection },
    });
  },
};
