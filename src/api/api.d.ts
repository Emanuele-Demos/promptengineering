export const API_ROUTES: {
  add_status: string
  get_stati: string
  categories: string
  category: (id: string) => string
}

export function addStatus(valore_stato: string): Promise<{ slug: string; valore_stato: string }>
export function getStati(): Promise<Array<{ slug: string; valore_stato: string }>>

export interface CategoryDto {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  taskCount?: number
}

export function getCategories(): Promise<CategoryDto[]>
export function getCategory(id: string): Promise<CategoryDto>
export function createCategory(input: { name: string; color: string }): Promise<CategoryDto>
export function updateCategory(id: string, input: { name: string; color: string }): Promise<CategoryDto>
export function deleteCategory(id: string): Promise<{ message: string }>
