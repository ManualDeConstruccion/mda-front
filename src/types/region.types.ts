export interface Region {
  id: number;
  region: string;
  region_number?: string; // Opcional porque el backend no lo retorna siempre
  region_roman?: string; // Opcional porque el backend no lo retorna siempre
}

export interface Comuna {
  id: number;
  comuna: string;
  region: Region;
} 