// Esta función es genérica y permite 'T' si la condición se cumple.
// El Type Guard generado verifica una coincidencia exacta de la propiedad 'type'.

export function createTypeGuard<T extends { type: string }>(
  // El valor de la propiedad 'type' que se espera.
  expectedType: string
): (error: any) => error is T {
  return (error: any): error is T =>
    // Verifica que el error no sea nulo ni indefinido.
    error != null &&
    // Verifica que sea un objeto (el error es de infraestructura y no un valor primitivo).
    typeof error === 'object' &&
    // Verifica que la propiedad 'type' coincida exactamente con el valor esperado.
    error.type === expectedType;
}

// Factory para crear Type Guards basados en un prefijo de la propiedad 'type'.
// Útil para verificar si un objeto pertenece a una categoría amplia de errores (ej. 'Database').

export function createTypeGuardForPrefix(
  // El prefijo de cadena con el que debe comenzar la propiedad 'type'.
  prefix: string
): (error: any) => error is { type: string } {
  return (error: any): error is { type: string } =>
    // Verifica que el error no sea nulo ni indefinido.
    error != null &&
    // Verifica que sea un objeto.
    typeof error === 'object' &&
    // Verifica que el objeto tenga una propiedad 'type' que sea una cadena.
    typeof error.type === 'string' &&
    // Verifica que la propiedad 'type' comience con el prefijo especificado.
    error.type.startsWith(prefix);
}