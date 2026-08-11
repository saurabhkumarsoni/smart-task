export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
}
