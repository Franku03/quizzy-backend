// A token used for dependency injection of the EventBus implementation.
// This token acts as an identifier for the EventBus service within the NestJS framework.
// By using this token, different implementations of the EventBus can be swapped easily
// without changing the parts of the code that depend on it.
// It also enables singleton behavior for the EventBus across the application.
export const EVENT_BUS_TOKEN = 'EVENT_BUS';