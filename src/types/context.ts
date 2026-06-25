import { Context, Scenes } from 'telegraf';

export interface BotSession extends Scenes.SceneSession {
  taskId?: number;
  userId?: number;
  assignmentId?: number;
  step?: string;
}

export interface BotContext extends Context {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext>;
  match: RegExpExecArray;
}

export interface BotSession extends Scenes.SceneSession {
  taskId?: number;
  userId?: number;
  assignmentId?: number;
  submissionId?: number;
  approvalMessageId?: number;
  approvalMessageText?: string;
  assignmentMessageId?: number;
  step?: string;
}

export interface BotContext extends Context {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext>;
  match: RegExpExecArray;
}
