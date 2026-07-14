export const API_ROUTES: {
  add_status: string
  get_stati: string
}

export function addStatus(valore_stato: string): Promise<{ slug: string; valore_stato: string }>
export function getStati(): Promise<Array<{ slug: string; valore_stato: string }>>
