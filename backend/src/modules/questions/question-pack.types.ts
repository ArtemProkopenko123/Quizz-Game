export interface QuestionOption {
  text: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface QuestionPack {
  id: string;
  title: string;
  emoji?: string;
  version: number;
  language: string;
  questions: Question[];
}

/** What the client receives — no correctAnswerIndex */
export interface QuestionPayload {
  id: string;
  prompt: string;
  options: string[];
}
