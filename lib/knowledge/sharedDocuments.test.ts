import { describe, expect, it } from 'vitest';
import {
  canManageKnowledgeShares,
  isTelecallingDocumentRole,
  TELECALLING_DOCUMENT_ROLES,
} from './sharedDocuments';

describe('Knowledge document sharing roles', () => {
  it('allows only Knowledge Admin-level roles to manage assignments', () => {
    expect(canManageKnowledgeShares('knowledge_admin')).toBe(true);
    expect(canManageKnowledgeShares('admin')).toBe(true);
    expect(canManageKnowledgeShares('manager')).toBe(true);
    expect(canManageKnowledgeShares('knowledge_manager')).toBe(false);
    expect(canManageKnowledgeShares('knowledge_viewer')).toBe(false);
  });

  it('recognizes every supported Telecalling recipient role', () => {
    for (const role of TELECALLING_DOCUMENT_ROLES) {
      expect(isTelecallingDocumentRole(role)).toBe(true);
    }
    expect(isTelecallingDocumentRole('knowledge_viewer')).toBe(false);
    expect(isTelecallingDocumentRole('client')).toBe(false);
  });
});
