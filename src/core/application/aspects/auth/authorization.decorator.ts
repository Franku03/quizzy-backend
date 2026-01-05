// application/decorators/Authorize.ts

import { IAuthorizer } from "./authorizer.interface";
import { Either } from "src/core/types";

// Type definition for the class constructor of an Authorizer
// This allows us to type the Strategy parameter in the Authorize decorator factory
// as a class that can be instantiated to produce an IAuthorizer instance.
type AuthorizerClass = new () => IAuthorizer<any, any, any>;


// Authorization Decorator Factory
// This decorator applies an authorization strategy to a command or query handler method.
// It extracts the command/query and the necessary context from the handler instance,
// then invokes the strategy's authorize method before proceeding to the original method.

export function Authorize(
  Strategy: AuthorizerClass, 
  contextPropertyKey: string,
  // Optional operation name to specify the action being authorized.
  // If not provided, it will be derived from the handler class name.
  // Do not worry about this parameter if your strategy does not use/need it.
  operationName?: string, 
) {
  // The actual decorator function. This syntax is standard for typescript method decorators.
  // target: The prototype of the class
  // propertyKey: The name of the method being decorated
  // descriptor: The property descriptor for the method
  // Typescript decorators require us to use this signature and return a modified descriptor.
  // if unfamiliar, see: https://www.typescriptlang.org/docs/handbook/decorators.html#method-decorators
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    
    // Store the original method for later use 
    // so we can call it after authorization
    const originalMethod = descriptor.value;

    // We replace the original method with a new function that includes authorization logic
    // This new function will be called instead of the original method
    descriptor.value = async function (...args: any[]) {
      // args[0] is expected to be the command/query object
      // This is a convention based on how command/query handlers are defined
      const command = args[0];

      // Then we retrieve the context from the handler instance
      // using the provided contextPropertyKey. This context is typically a repository
      // or service that the strategy needs to perform authorization checks.
      // It is assumed that the context is a property of the handler instance (this).
      // For example, if contextPropertyKey is 'attemptRepository', we access this.attemptRepository
      // (this as any) is used to bypass TypeScript's strict type checking for dynamic property access.
      const context = (this as any)[contextPropertyKey];

      // If the context is not found, we throw an error
      // (!) If a command/query does not need authorization, the decorator should not be applied
      if (!context) {
        throw new Error(`Authorization Error: Context '${contextPropertyKey}' is undefined on ${target.constructor.name}.`);
      }

      // We determine the operation name. 
      // If an operationName was provided to the decorator, we use that.
      // Otherwise, we derive it from the class name by stripping common suffixes.
      const finalOperationName = operationName || 
          target.constructor.name
            .replace('Handler', '')
            .replace('Query', '')
            .replace('Command', '');
      // We attach the operation name to the command for potential use in the authorization strategy.
      command.operationName = finalOperationName;
      
      // Then, we instantiate the Strategy and Run the authorization logic
      // Note: if instead we used the direct strategy as a parameter, and did
      // @Authorize(new Strategy(), 'contextPropertyKey') in the handlers, that would cause 
      // the same instance to be shared across all invocations, which could lead to 
      // state-related bugs if the strategy maintains any internal state.
      // By passing the class and instantiating it within the decorator, 
      // we ensure a fresh instance per invocation.
      const strategy = new Strategy();
      
      // We call the authorize method of the strategy with the command and context
      // This method may return void or an Either indicating success or failure
      const authResult = await strategy.authorize(command, context);

      // If the result is an Either, we check if it's a Left (error) or Right (success)
      if (Either.isEither(authResult)) {
        if (authResult.isLeft()) {
          // If it's a Left, we return the error result immediately
          return authResult;
        }
        
        // If it's a Right, we can optionally extract the TResource from it (IF IT HAS IT ONLY)
        // and attach it to the command for further processing down the line
        // This step couples the handler logic to the authorization strategy so only use if necessary
        const resource = authResult.getRight();
        if (resource !== undefined && resource !== null) {
          command.validatedResource = resource;
        }
      }

      // Finally, if the action is authorized, we proceed to the original method
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}