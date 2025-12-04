// src/singleplayer/application/mappers/submission.mapper.ts

import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ResponseTime } from "src/core/domain/shared-value-objects/value-objects/value.object.response-time";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Optional } from "src/core/types/optional";
import { Points } from "src/core/domain/shared-value-objects/value-objects/value.object.points";
import { TimeLimitSeconds } from "src/core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds";
import { Option } from "src/kahoots/domain/value-objects/kahoot.slide.option";

// This mapper transforms an external request into a Submission value object.
// It encapsulates the logic needed to create a domain-level Submission
// from minimal input data typically provided by the player request.
// It keeps the domain layer pure and independent of external concerns. (external DTOs, API formats, etc.)
export class SubmissionMapper {
  
  // Creates a Submission value object from the minimal data required from an API request.
  // This method encapsulates the application logic for constructing a submission
  // when only basic answer information is available from the player request.
  static fromPlayerResponse(
    slideId: SlideId,
    answerIndex: number[],
    responseTime: ResponseTime
  ): Submission {
    
    // We create empty Optionals for fields that are not provided in the request.
    // These will be enriched later during domain evaluation when the full
    // question context is available from the Kahoot aggregate.
    const emptyQuestionText = new Optional<string>();
    const emptyQuestionPoints = new Optional<Points>();
    const emptyTimeLimit = new Optional<TimeLimitSeconds>();
    const emptyAnswerText = new Optional<Option[]>();
    
    // We wrap the answerIndex in an Optional to maintain consistency
    // with the domain model's design. An empty array represents a timeout.
    const answerIndexOptional = new Optional<number[]>(answerIndex);
    
    // We create and return the Submission value object using the domain constructor.
    // This ensures that all domain invariants are validated at the point of creation.
    return new Submission(
      slideId,
      emptyQuestionText,
      emptyQuestionPoints,
      emptyTimeLimit,
      emptyAnswerText,
      answerIndexOptional,
      responseTime
    );
  }

  // Helper method to validate the raw data from an API request.
  // This method performs basic structural validation without creating domain objects.
  // It's used by controllers to provide early feedback on invalid requests.
  static validateRequestData(
    slideIdString: unknown,
    answerIndex: unknown,
    timeElapsedSeconds: unknown
  ): { isValid: boolean; error?: string } {
    
    if (typeof slideIdString !== 'string' || slideIdString.trim() === '') {
      return {
        isValid: false,
        error: "slideId must be a non-empty string"
      };
    }
    
    if (!Array.isArray(answerIndex)) {
      return {
        isValid: false,
        error: "answerIndex must be an array"
      };
    }
    
    // Ensure all elements in answerIndex are valid numbers
    if (answerIndex.some((index: unknown) => 
        typeof index !== 'number' || !Number.isInteger(index) || index < 0)) {
      return {
        isValid: false,
        error: "All elements in answerIndex must be non-negative integers"
      };
    }
    
    if (typeof timeElapsedSeconds !== 'number' || 
        timeElapsedSeconds < 0 || 
        !Number.isFinite(timeElapsedSeconds)) {
      return {
        isValid: false,
        error: "timeElapsedSeconds must be a non-negative finite number"
      };
    }
    
    return { isValid: true };
  }

}


