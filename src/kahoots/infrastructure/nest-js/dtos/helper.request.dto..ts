export const cleanNullToUndefined = ({ value }: { value: any }) => value === null ? undefined : value;
