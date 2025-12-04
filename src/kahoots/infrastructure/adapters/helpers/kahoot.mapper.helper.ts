export class MapperHelper {

    public static capitalizeFirstLetter(value: string | null ): string | null {
        // 1. Guardias de seguridad para manejar null/undefined/no-strings
        if (typeof value !== 'string' || !value?.trim()) {
            // Si es undefined, devolvemos null (comportamiento API común para ReadModels).
            // Si es null, devolvemos null.
            return value === undefined ? null : value; 
        }
        
        // 2. Procesa la transformación
        const trimmedValue = value.trim().toLowerCase();
        
        // Si después de limpiar el espacio el string está vacío, devuelve null
        if (trimmedValue.length === 0) {
            return null;
        }
        
        // 3. Aplica la lógica: primera letra en mayúscula + resto en minúsculas
        return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1);
    }
}