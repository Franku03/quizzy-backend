export const cleanNullToUndefined = ({ value }: { value: any }) => value === null ? undefined : value;

export function toUpperCase(params: { value: any }): string | undefined | null {
  const value = params.value;
  if (typeof value !== 'string' || !value) {
    return value;
  }
  return value.toUpperCase();
}
