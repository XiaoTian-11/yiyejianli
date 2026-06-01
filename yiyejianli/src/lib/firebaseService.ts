import { db, auth } from './firebase';
import { 
  collection,
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { ResumeData } from '../types';
import { INITIAL_DATA } from '../constants';

export interface ResumeDocument {
  id: string;
  userId: string;
  name: string;
  data: ResumeData;
  score: number;
  status: 'new' | 'draft' | 'completed';
  updatedAt: any;
  templateId?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to format Time Ago
export const formatTimeAgo = (date: any): string => {
  if (!date) return '未知时间';
  let d: Date;
  if (date && typeof date.toDate === 'function') {
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

// Fetch all resumes for a user
export const getResumesList = async (userId: string, isDemo?: boolean): Promise<ResumeDocument[]> => {
  if (isDemo) {
    const saved = localStorage.getItem(`resumes_demo_${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved) as ResumeDocument[];
      } catch (e) {
        // Fallback
      }
    }
    // Create initial default for demo user
    const defaultResumes: ResumeDocument[] = [{
      id: 'default',
      userId,
      name: '经典求职通用简历',
      data: INITIAL_DATA,
      score: 85,
      status: 'new',
      updatedAt: new Date().toISOString()
    }];
    localStorage.setItem(`resumes_demo_${userId}`, JSON.stringify(defaultResumes));
    return defaultResumes;
  }

  const path = 'resumes';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    let list: ResumeDocument[] = [];
    querySnapshot.forEach((docSnap) => {
      const dataDoc = docSnap.data();
      list.push({
        id: docSnap.id,
        userId: dataDoc.userId,
        name: dataDoc.name || '未命名简历',
        data: dataDoc.data as ResumeData,
        score: dataDoc.score || 80,
        status: dataDoc.status || 'draft',
        updatedAt: dataDoc.updatedAt,
        templateId: dataDoc.templateId || 'modern',
      });
    });

    // Handle legacy resume mapping if there are no resumes but they have a legacy record mapping to their userId (using userId as primary key)
    if (list.length === 0) {
      // Check legacy `resumes/${userId}` document
      const legacyDocSnap = await getDoc(doc(db, 'resumes', userId));
      if (legacyDocSnap.exists()) {
        const legacyDocData = legacyDocSnap.data();
        const legacyResume: ResumeDocument = {
          id: userId,
          userId,
          name: legacyDocData.name || (legacyDocData.data?.personalInfo?.fullName 
                ? `${legacyDocData.data.personalInfo.fullName}的求职简历` 
                : '经典求职通用简历'),
          data: legacyDocData.data as ResumeData,
          score: legacyDocData.score || 85,
          status: legacyDocData.status || 'new',
          updatedAt: legacyDocData.updatedAt
        };
        // Save the renamed legacy resume at userId to make sure it contains clean parameters
        await setDoc(doc(db, 'resumes', userId), {
          userId,
          name: legacyResume.name,
          data: legacyResume.data,
          score: legacyResume.score,
          status: legacyResume.status,
          updatedAt: serverTimestamp()
        });
        return [legacyResume];
      }

      // Create new default resume
      const newId = 'default_' + userId;
      const defaultDoc = {
        userId,
        name: '经典求职通用简历',
        data: INITIAL_DATA,
        score: 85,
        status: 'new' as const,
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'resumes', newId), defaultDoc);
      
      return [{
        id: newId,
        userId,
        name: defaultDoc.name,
        data: defaultDoc.data,
        score: defaultDoc.score,
        status: defaultDoc.status,
        updatedAt: null // Will represent now
      }];
    }

    // Sort by updatedAt desc in JS to circumvent index constraints if firestore indexes are not active yet
    return list.sort((a, b) => {
      const timeA = a.updatedAt && typeof a.updatedAt.toDate === 'function' ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt || 0).getTime();
      const timeB = b.updatedAt && typeof b.updatedAt.toDate === 'function' ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

// Legacy compatibility for load
export const getResume = async (userId: string, isDemo?: boolean): Promise<ResumeData | null> => {
  const resumes = await getResumesList(userId, isDemo);
  return resumes.length > 0 ? resumes[0].data : null;
};

// Legacy compatibility for save
export const saveResume = async (userId: string, data: ResumeData, isDemo?: boolean) => {
  const resumes = await getResumesList(userId, isDemo);
  const activeId = resumes.length > 0 ? resumes[0].id : (isDemo ? 'default' : 'default_' + userId);
  const name = resumes.length > 0 ? resumes[0].name : '经典求职通用简历';
  const score = resumes.length > 0 ? resumes[0].score : 85;
  const status = resumes.length > 0 ? resumes[0].status : 'draft';
  await saveResumeWithId(userId, activeId, name, data, score, status, isDemo);
};

// Real multi-resume save with id
export const saveResumeWithId = async (
  userId: string, 
  resumeId: string, 
  name: string, 
  data: ResumeData, 
  score: number, 
  status: 'new' | 'draft' | 'completed',
  isDemo?: boolean,
  templateId?: string
): Promise<void> => {
  if (isDemo) {
    const list = await getResumesList(userId, isDemo);
    const existingIndex = list.findIndex(r => r.id === resumeId);
    const existing = existingIndex > -1 ? list[existingIndex] : null;
    
    const docData: ResumeDocument = {
      id: resumeId,
      userId,
      name,
      data,
      score,
      status,
      updatedAt: new Date().toISOString(),
      templateId: templateId || existing?.templateId || 'modern'
    };
    
    if (existingIndex > -1) {
      list[existingIndex] = docData;
    } else {
      list.push(docData);
    }
    localStorage.setItem(`resumes_demo_${userId}`, JSON.stringify(list));
    return;
  }

  const path = `resumes/${resumeId}`;
  try {
    const docRef = doc(db, 'resumes', resumeId);
    await setDoc(docRef, {
      userId,
      name,
      data,
      score,
      status,
      updatedAt: serverTimestamp(),
      ...(templateId ? { templateId } : {})
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Delete Resume
export const deleteResume = async (userId: string, resumeId: string, isDemo?: boolean): Promise<void> => {
  if (isDemo) {
    const list = await getResumesList(userId, isDemo);
    const filtered = list.filter(r => r.id !== resumeId);
    localStorage.setItem(`resumes_demo_${userId}`, JSON.stringify(filtered));
    return;
  }

  const path = `resumes/${resumeId}`;
  try {
    const docRef = doc(db, 'resumes', resumeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Rename Resume
export const renameResume = async (userId: string, resumeId: string, newName: string, isDemo?: boolean): Promise<void> => {
  if (isDemo) {
    const list = await getResumesList(userId, isDemo);
    const existing = list.find(r => r.id === resumeId);
    if (existing) {
      existing.name = newName;
      existing.updatedAt = new Date().toISOString();
      localStorage.setItem(`resumes_demo_${userId}`, JSON.stringify(list));
    }
    return;
  }

  const path = `resumes/${resumeId}`;
  try {
    const docRef = doc(db, 'resumes', resumeId);
    await updateDoc(docRef, {
      name: newName,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Create a completely new resume
export const createNewResume = async (userId: string, name: string, isDemo?: boolean, templateId: string = 'modern', initialData?: ResumeData): Promise<string> => {
  const newId = generateId() + '_' + userId;
  const startingData = initialData || INITIAL_DATA;
  if (isDemo) {
    const list = await getResumesList(userId, isDemo);
    const docData: ResumeDocument = {
      id: newId,
      userId,
      name,
      data: startingData,
      score: 80,
      status: 'new',
      updatedAt: new Date().toISOString(),
      templateId
    };
    list.push(docData);
    localStorage.setItem(`resumes_demo_${userId}`, JSON.stringify(list));
    return newId;
  }

  const path = `resumes/${newId}`;
  try {
    const docRef = doc(db, 'resumes', newId);
    await setDoc(docRef, {
      userId,
      name,
      data: startingData,
      score: 80,
      status: 'new',
      updatedAt: serverTimestamp(),
      templateId
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
};
