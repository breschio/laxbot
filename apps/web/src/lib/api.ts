// Placeholder for future API integration
export const fetchFromApi = async <T>(endpoint: string): Promise<T> => {
  // In the future, this will call the backend API (e.g., /api/teams)
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('API error');
  return res.json();
}; 