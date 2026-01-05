// route: src/core/application/aspects/auth/authorizer.interface.ts

import { Either, ErrorData } from "src/core/types";

// Defines a generic interface for an authorizer that checks 
// if a command can be executed within a given context.
// This is a strategy pattern for implementing the different authorization logic each 
// command and query handler might require. The correct strategy will be given to the 
// auth decorator on each handler.
// return type is flexible to support different types of authorization strategies.
// IMPORTANT: TResource is OPTIONAL and defaults to void.
// ONLY USE TResource IF YOU WANT YOUR STRATEGY TO RETURN A RESOURCE TO THE HANDLER. 
// THIS WILL COUPLE YOUR HANDLER LOGIC TO THE  AUTHORIZATION STRATEGY 
// WILL HAVE TO BE CHANGED IF ALONZO DOES NOT AGREE WITH THIS APPROACH
export interface IAuthorizer<TCommand, TContext, TResource = void> {
  authorize(command: TCommand, context: TContext): Promise<void> | Promise<Either<ErrorData, TResource>>;
}