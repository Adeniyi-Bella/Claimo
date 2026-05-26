export interface AddTaskToDocumentRequestDto {
  title: string;
  dueDate?: string | null;
  location?: string | null;
}