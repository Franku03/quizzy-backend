// route: src/core/application/aspects/auth/authorizer.interface.ts

import { Either, ErrorData } from "src/core/types";

// Defines a generic interface for an authorizer that checks 
// if a command can be executed within a given context.
// This is a strategy pattern for implementing the different authorization logic each 
// command and query handler might require. The correct strategy will be given to the 
// auth decorator on each handler.
// return type is flexible to support different types of authorization strategies.
export interface IAuthorizer<TCommand, TContext> {
  authorize(command: TCommand, context: TContext): Promise<void> | Promise<Either<ErrorData, void>>;
}