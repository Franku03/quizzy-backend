import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";
import { MultiplayerSessionId } from '../../../core/domain/shared-value-objects/id-objects/multiplayer-session.id';

interface MultiplayerSessionProps {

};

export class MultiplayerSession extends AggregateRoot<MultiplayerSessionProps, MultiplayerSessionId> {


    protected checkInvariants(): void {
        
    }
    
}

/*
- sessionId: MultiplayerSessionId
- hostID: UserID
- kahootId: KahootID
- sessionPin: SessionPin
- startedAt: Date
- gameState: GameState
- ranking: Scoreboard
- progress: SessionProgress
- players: Map<UserID | UUID, Player>
- playersAnswers: Map <SlideId, SlideResult>

+ createSession(kahootId: KahootId, hostId: UserId): GamePin
+ generatePin(): SessionPin
+ joinPlayer(string nickname)
+ addSlideResults(SlideId slideID, SlideResult result): void
+ updatePlayersScores(): void
+ startGame(): void
+ advanceToNextPhase(boolean hasMoreSlides): void
+ endGame(): void
+ getPlayersAnswers(): SlidePlayerAnswer[]
- setters

*/