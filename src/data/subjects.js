import technikData from '../../public/data/technik.json';
import organisationData from '../../public/data/organisation.json';
import fuehrungData from '../../public/data/fuehrung.json';

// `isPremium: false` means the subject is free for all users.
// Free tier (without purchase): 20 Demo-Fragen aus jedem Fach.
export const SUBJECTS = [
  { id: 'technik', name: 'Technik', icon: '⚡', color: '#3B82F6', isPremium: true },
  { id: 'organisation', name: 'Organisation', icon: '🗂️', color: '#10B981', isPremium: true },
  { id: 'fuehrung', name: 'Führung und Personal', icon: '👥', color: '#F59E0B', isPremium: true },
];

// Number of free demo questions for premium subjects (when not purchased)
export const DEMO_QUESTION_LIMIT = 20;

const DATA_MAP = {
  technik: technikData,
  organisation: organisationData,
  fuehrung: fuehrungData,
};

export function getQuestions(subjectId) {
  return DATA_MAP[subjectId]?.questions || [];
}

export function getSubject(subjectId) {
  return SUBJECTS.find((s) => s.id === subjectId);
}
