import { supabase } from './supabase';
import { ResumeData } from '../types';
import { INITIAL_DATA } from '../constants';

export interface ResumeDocument {
  id: string;
  userId: string;
  name: string;
  data: ResumeData;
  score: number;
  status: 'new' | 'draft' | 'completed';
  updatedAt: string;
  templateId?: string;
}

// Helper to format Time Ago（与 Firebase 版本相同，直接处理 ISO 字符串）
export const formatTimeAgo = (date: any): string => {
  if (!date) return '未知时间';
  let d: Date;

  if (typeof date === 'string' || typeof date === 'number') {
    d = new Date(date);
  } else if (date && typeof date.toDate === 'function') {
    // 兼容旧 Firebase Timestamp 类型（过渡期可能还存在旧数据引用）
    d = date.toDate();
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return '刚刚';

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Generates a safe unique short random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

// 辅助：将 Supabase 行转换为 ResumeDocument
function rowToResume(row: any): ResumeDocument {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name || '未命名简历',
    data: row.data as ResumeData,
    score: row.score || 80,
    status: row.status || 'draft',
    updatedAt: row.updated_at,
    templateId: row.template_id || 'modern',
  };
}

// Fetch all resumes for a user
export const getResumesList = async (userId: string): Promise<ResumeDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase Error (getResumesList):', JSON.stringify(error));
      throw new Error(JSON.stringify(error));
    }

    let list: ResumeDocument[] = (data || []).map(rowToResume);

    // Legacy handling: no results → check legacy doc (id = userId)
    if (list.length === 0) {
      const { data: legacyData, error: legacyError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (legacyError && !legacyError.message.includes('contains 0 rows')) {
        console.error('Supabase Error (legacy check):', JSON.stringify(legacyError));
      }

      if (legacyData) {
        const legacyResume = rowToResume(legacyData);
        // Update legacy record to clean format
        await supabase
          .from('resumes')
          .upsert({
            id: userId,
            user_id: userId,
            name: legacyResume.name,
            data: legacyResume.data,
            score: legacyResume.score,
            status: legacyResume.status,
            template_id: legacyResume.templateId || 'modern',
          });
        return [legacyResume];
      }

      // Create new default resume
      const newId = 'default_' + userId;
      const defaultDoc = {
        id: newId,
        user_id: userId,
        name: '经典求职通用简历',
        data: INITIAL_DATA,
        score: 85,
        status: 'new' as const,
        template_id: 'modern',
      };
      const { error: insertError } = await supabase
        .from('resumes')
        .insert(defaultDoc);

      if (insertError) {
        console.error('Supabase Error (create default):', JSON.stringify(insertError));
      }

      return [{
        id: newId,
        userId,
        name: defaultDoc.name,
        data: defaultDoc.data,
        score: defaultDoc.score,
        status: defaultDoc.status,
        updatedAt: new Date().toISOString(),
        templateId: defaultDoc.template_id,
      }];
    }

    return list;
  } catch (error) {
    console.error('Supabase Error:', error);
    return [];
  }
};

// Legacy compatibility for load
export const getResume = async (userId: string): Promise<ResumeData | null> => {
  const resumes = await getResumesList(userId);
  return resumes.length > 0 ? resumes[0].data : null;
};

// Legacy compatibility for save
export const saveResume = async (userId: string, data: ResumeData) => {
  const resumes = await getResumesList(userId);
  const activeId = resumes.length > 0 ? resumes[0].id : 'default_' + userId;
  const name = resumes.length > 0 ? resumes[0].name : '经典求职通用简历';
  const score = resumes.length > 0 ? resumes[0].score : 85;
  const status = resumes.length > 0 ? resumes[0].status : 'draft';
  await saveResumeWithId(userId, activeId, name, data, score, status);
};

// Real multi-resume save with id
export const saveResumeWithId = async (
  userId: string,
  resumeId: string,
  name: string,
  data: ResumeData,
  score: number,
  status: 'new' | 'draft' | 'completed',
  templateId?: string
): Promise<void> => {
  try {
    // 先检查记录是否存在，确定是用 insert 还是 update
    const { data: existingRows } = await supabase
      .from('resumes')
      .select('id')
      .eq('id', resumeId)
      .maybeSingle();

    const row = {
      id: resumeId,
      user_id: userId,
      name,
      data,
      score,
      status,
      template_id: templateId || 'modern',
    };

    if (existingRows) {
      const { error } = await supabase
        .from('resumes')
        .update(row)
        .eq('id', resumeId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('resumes')
        .insert(row);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Supabase Error (saveResumeWithId):', JSON.stringify(error));
    throw new Error(JSON.stringify(error));
  }
};

// Delete Resume
export const deleteResume = async (userId: string, resumeId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);

    if (error) throw error;
  } catch (error) {
    console.error('Supabase Error (deleteResume):', JSON.stringify(error));
    throw new Error(JSON.stringify(error));
  }
};

// Rename Resume
export const renameResume = async (userId: string, resumeId: string, newName: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('resumes')
      .update({ name: newName })
      .eq('id', resumeId);

    if (error) throw error;
  } catch (error) {
    console.error('Supabase Error (renameResume):', JSON.stringify(error));
    throw new Error(JSON.stringify(error));
  }
};

// Create a completely new resume
export const createNewResume = async (
  userId: string,
  name: string,
  templateId: string = 'modern',
  initialData?: ResumeData
): Promise<string> => {
  const newId = generateId() + '_' + userId;
  const startingData = initialData || INITIAL_DATA;

  try {
    const { error } = await supabase
      .from('resumes')
      .insert({
        id: newId,
        user_id: userId,
        name,
        data: startingData,
        score: 80,
        status: 'new',
        template_id: templateId,
      });

    if (error) throw error;
    return newId;
  } catch (error) {
    console.error('Supabase Error (createNewResume):', JSON.stringify(error));
    return '';
  }
};
