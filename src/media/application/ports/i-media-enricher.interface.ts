/**
 * Interfaz común para todos los Media Enrichers.
 * Permite que los enrichers sean síncronos (velocidad) o asíncronos (DB) 
 * de forma transparente.
 */
export interface IMediaEnricher<T> {
  enrich(target: T, urlMap: Map<string, string>): T | Promise<T>;
}