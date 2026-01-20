/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\domain\entities\group.assignment.ts

import { Entity } from "src/core/domain/abstractions/entity";
import { GroupId } from "../value-objects/group.id";
import { GroupAssignmentId } from "../value-objects/group.assignment.id";

interface UserId {
    readonly value: string;
}

interface KahootId {
    readonly value: string;
}

interface GroupAssignmentProps {
    groupId: GroupId;
    quizId: KahootId;
    assignedBy: UserId;
    availableFrom: Date;
    availableUntil: Date;
    isAssignmentCompleted: boolean;
}


export class GroupAssignment extends Entity<GroupAssignmentProps, GroupAssignmentId> {
    constructor(properties: GroupAssignmentProps, id: GroupAssignmentId) {
        
        if (properties.availableFrom > properties.availableUntil) {
            throw new Error("La fecha de inicio debe ser anterior a la fecha de fin.");
        }
        

        super(properties, id);
    }


    isActive(): boolean {
        if(this.properties.availableUntil < new Date()) {
            return false;
        }
        if(this.properties.availableFrom > new Date()) {
            return false;
        }
        return true;
    }


    isCompleted(): boolean {
        return this.properties.isAssignmentCompleted;
    }

    public getAssignedUser(): UserId {
        return this.properties.assignedBy;
    }

    public getQuizId(): KahootId {
        return this.properties.quizId;
    }

    public markAsCompleted(): void {
        this.properties.isAssignmentCompleted = true;
    }

    public toPrimitives() {
        return {
            id: this.id.value,
            quizId: this.properties.quizId.value,
            assignedBy: this.properties.assignedBy.value,
            availableFrom: this.properties.availableFrom,
            availableUntil: this.properties.availableUntil,
            isAssignmentCompleted: this.properties.isAssignmentCompleted
        };
    }
}

