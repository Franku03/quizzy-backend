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
  
  private constructor(props: QuestionSnapshotProps) {
    super(props);
    
    // Invariant checks 
    if (!props.questionText || props.questionText.trim().length === 0) {
      throw new Error('Question text cannot be empty.');
    }
    if (props.questionText.length > GLOBAL_MAX_QUESTION_LENGTH) {
      throw new Error(`Question text cannot exceed ${GLOBAL_MAX_QUESTION_LENGTH} characters.`);
    }
    if (!props.basePoints) {
      throw new Error('Base points are required.');
    }
    if (!props.timeLimit) {
      throw new Error('Time limit is required.');
    }
  }

  // + create(questionText: String, basePoints: BasePoints, timeLimit: TimeLimitSeconds): questionSnapshot
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
}