import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";

export interface IUuidGenerationService {
    generateIUserId(): string;
}