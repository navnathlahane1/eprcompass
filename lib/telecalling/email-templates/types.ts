export type EmailTemplateCategory = 'plastic' | 'ewaste' | 'battery' | 'tyre' | 'general';

export type EmailTemplateCallStage =
  | 'intro'
  | 'follow_up'
  | 'proposal_sent'
  | 'objection'
  | 'closing'
  | 'post_sale';

export type EmailTemplateUsageAction =
  | 'copied'
  | 'opened_in_gmail'
  | 'opened_in_outlook'
  | 'downloaded_attachment';

export interface EmailTemplate {
  id: string;
  title: string;
  category: EmailTemplateCategory;
  call_stage: EmailTemplateCallStage;
  subject: string;
  body_html: string;
  body_plain: string;
  is_active: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateAttachment {
  id: string;
  template_id: string;
  file_name: string;
  storage_path: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  sort_order: number;
  created_at?: string;
}

export interface EmailTemplateLink {
  id: string;
  template_id: string;
  label: string;
  url: string;
  sort_order: number;
  created_at?: string;
}

export interface EmailTemplateUsage {
  id: string;
  template_id: string;
  user_id?: string | null;
  action: EmailTemplateUsageAction;
  created_at: string;
}

export interface EmailTemplateWithRelations extends EmailTemplate {
  attachments: EmailTemplateAttachment[];
  links: EmailTemplateLink[];
}

export interface EmailTemplateFilters {
  activeOnly?: boolean;
  category?: EmailTemplateCategory | 'all';
  callStage?: EmailTemplateCallStage | 'all';
  search?: string;
}

export interface EmailTemplateSaveInput {
  title: string;
  category: EmailTemplateCategory;
  call_stage: EmailTemplateCallStage;
  subject: string;
  body_html: string;
  is_active?: boolean;
  links?: Array<Pick<EmailTemplateLink, 'label' | 'url' | 'sort_order'>>;
}
