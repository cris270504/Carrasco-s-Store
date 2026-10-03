// Reglas de contraseña del registro y de restablecer contraseña (CU-V08, CU-V11).
// Deben coincidir con la política configurada en Supabase Auth.
export const PASSWORD_MIN_LENGTH = 8

// Devuelve los requisitos que aún no cumple la contraseña (vacío = válida).
export function passwordIssues(password: string): string[] {
  const issues: string[] = []
  if (password.length < PASSWORD_MIN_LENGTH) issues.push(`al menos ${PASSWORD_MIN_LENGTH} caracteres`)
  if (!/[a-z]/.test(password)) issues.push('una minúscula')
  if (!/[A-Z]/.test(password)) issues.push('una mayúscula')
  if (!/[0-9]/.test(password)) issues.push('un número')
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('un símbolo')
  return issues
}
