export interface CreateProjectRequestDto {
  name: string;
  description?: string | null;
  location?: string | null;
  startDate?: string | null;
}
