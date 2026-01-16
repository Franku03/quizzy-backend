import { SubmissionFactory } from "src/core/domain/factories/submission.factory";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";

export class SubmissionValueObjectMother {


    private static assembleSubmission( slideSnapshot: SlideSnapshot ): Submission {

        const { id } = slideSnapshot!

        const slideId = new SlideId( id );

        const playerSubmissionResult = SubmissionFactory.buildDomainSubmission(
            slideId,
            slideSnapshot!,
            4000,
            ["0"],
        );

        return playerSubmissionResult.getRight()
    }


    public static createValidSubmission( kahoot: Kahoot ): Submission {

        const slideSnapshot = kahoot.getNextSlideSnapshotByIndex();

        return this.assembleSubmission( slideSnapshot! );

    }
    

    public static createSubmissionForSlideStillNotPlayed( kahoot: Kahoot ): Submission {

        const slideSnapshot = kahoot.getNextSlideSnapshotByIndex(0);

        return this.assembleSubmission( slideSnapshot! );

    }



    public static createInvalidSubmission( kahoot: Kahoot ): Submission {

        const slideSnapshot = kahoot.getNextSlideSnapshotByIndex();

        const slideId = new SlideId("ecaddd53-e778-4bc2-b3c9-a623042b7739"); // Id de slide no existente en el kahoot

        const playerSubmissionResult = SubmissionFactory.buildDomainSubmission(
            slideId,
            slideSnapshot!,
            4000,
            ["0"],
        );

        return playerSubmissionResult.getRight();

    }


}