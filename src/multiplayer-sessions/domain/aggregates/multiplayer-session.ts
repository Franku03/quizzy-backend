import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";
import { MultiplayerSessionId } from '../../../core/domain/shared-value-objects/id-objects/multiplayer-session.id';

interface MultiplayerSessionProps {

};

export class MultiplayerSession extends AggregateRoot<MultiplayerSessionProps, MultiplayerSessionId> {


    protected checkInvariants(): void {
        
    }
    
}