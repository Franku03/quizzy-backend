// src/core/application/mapper/i-mapper.interface.ts
export interface IMapper<I, O> {
  map(input: I): O | Promise<O>;
}