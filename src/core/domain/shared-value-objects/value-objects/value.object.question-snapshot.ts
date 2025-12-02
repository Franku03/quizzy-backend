import { ValueObject } from 'src/core/domain/abstractions/value.object';
import { Points } from './value.object.points'; 
import { TimeLimitSeconds } from './value.object.time-limit-seconds';
import { GLOBAL_MAX_QUESTION_LENGTH } from './../constants/global-kahoot-constants';

interface QuestionSnapshotProps {
  questionText: string;
  basePoints: Points;
  timeLimit: TimeLimitSeconds;
}

export class QuestionSnapshot extends ValueObject<QuestionSnapshotProps> {
  
  public constructor(props: QuestionSnapshotProps) {
    super(props);
    
    // Invariant checks 
    if (!props.questionText || props.questionText.trim().length === 0) {
      throw new Error('Question text cannot be empty.');
    }
    if (props.questionText.length > GLOBAL_MAX_QUESTION_LENGTH) {
      throw new Error(`Question text cannot exceed ${GLOBAL_MAX_QUESTION_LENGTH} characters.`);
    }
  }

  // Factory Method (used by clients to pass direct parameters instead of props object)
  public static create(
    questionText: string, 
    basePoints: Points, 
    timeLimit: TimeLimitSeconds
  ): QuestionSnapshot {
    return new QuestionSnapshot({
      questionText: questionText,
      basePoints: basePoints,
      timeLimit: timeLimit
    });
  }

  // Getters

  get questionText(): string {
    return this.properties.questionText;
  }

  get basePoints(): Points {
    return this.properties.basePoints;
  }

  get timeLimit(): TimeLimitSeconds {
    return this.properties.timeLimit;
  }
}