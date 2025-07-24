export type Sender = 'user' | 'ai';
export type MessageType = 'text' | 'image' | 'error' | 'grounded_text' | 'deployment' | 'website_analysis' | 'code_modification';

export type DeploymentStatus = 
  | 'initializing'
  | 'creating_repo'
  | 'pushing_files'
  | 'creating_site'
  | 'deploying'
  | 'success'
  | 'error';

export interface Source {
  uri: string;
  title: string;
}

export interface CodeChange {
  file: string;
  reason: string;
}

export interface CodeModificationPayload {
    explanation: string;
    changes: CodeChange[];
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  type: MessageType;
  imageUrl?: string;
  sources?: Source[];
  deploymentStatus?: DeploymentStatus;
  deploymentUrl?: string;
  analyzedUrl?: string;
  codeModification?: CodeModificationPayload;
}