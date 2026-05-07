// ================================
// EXISTING (jangan dihapus)
// ================================
export interface NotionUser {
  notionUserId: string;
  name: string | null;
  notionEmail: string | null;
  telegramId: string | null;
  employeeId: string | null;
}

export interface NotionWebhookPayload {
  source: {
    type: string;
    automation_id: string;
    action_id: string;
    event_id: string;
    attempt: number;
  };
  data: NotionPageData;
}

export interface NotionPageData {
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  in_trash: boolean;
  is_archived: boolean;
  properties: NotionUserProperties;
  url: string;
}

export interface NotionUserProperties {
  name: {
    id: string;
    type: 'title';
    title: Array<{ plain_text: string }>;
  };
  'notion email': {
    id: string;
    type: 'rich_text';
    rich_text: Array<{ plain_text: string }>;
  };
  'notion id': {
    id: string;
    type: 'people';
    people: Array<{
      id: string;
      name: string;
      type: 'person';
      person: { email: string };
    }>;
  };
  'telegram id': {
    id: string;
    type: 'rich_text';
    rich_text: Array<{ plain_text: string }>;
  };
  'employee id': {
    id: string;
    type: 'rich_text';
    rich_text: Array<{ plain_text: string }>;
  };
  PostgreSQL: {
    id: string;
    type: 'checkbox';
    checkbox: boolean;
  };
  Status: {
    id: string;
    type: 'select';
    select: { id: string; name: string; color: string } | null;
  };
  username: {
    id: string;
    type: 'rich_text';
    rich_text: Array<{ plain_text: string }>;
  };
}

// ================================
// NEW: WP ACTIVITY
// ================================
export interface WPActivity {
  id: string; // AFC-001/1.1.1
  notionPageId: string; // Notion page ID
  wpName: string; // Work Package name
  dueDate: string | null; // End date
  projectName: string | null; // dari formula
  linkPage: string | null; // Link This Page
  assigneeName: string | null;
  assigneeTelegramId: string | null;
  pmName: string | null;
  pmTelegramId: string | null;
}

// ================================
// NEW: ASSIGNING
// ================================
export interface AssigningRecord {
  notionPageId: string;
  wpId: string;
  respond: string | null; // 'Accept' | 'Reject' | null
  assignedAt: string | null;
}

// ================================
// NEW: ASSIGNMENT (untuk PostgreSQL)
// ================================
export interface CreateAssignmentData {
  notionPageId?: string;
  wpId: string;
  wpName: string;
  projectName?: string;
  dueDate?: Date;
  linkPage?: string;
  pmId: number;
  assigneeId: number;
}

// ================================
// NEW: SUBMISSION
// ================================
export interface SubmissionData {
  notionPageId: string;
  wpName: string;
  projectName: string | null;
  submittedDate: string | null;
  pageLink: string | null;
  deliverableName: string | null; // ← tambah
  assigneeName: string | null;
  assigneeTelegramId: string | null;
  userName: string | null;
  userTelegramId: string | null;
  pmName: string | null;
  pmTelegramId: string | null;
}

export interface CreateSubmissionData {
  notionPageId: string;
  wpName: string;
  projectName?: string;
  submittedDate?: Date;
  pageLink?: string;
  deliverableName?: string; // ← tambah
  assigneeId: number;
  userId: number;
  pmId: number;
}
