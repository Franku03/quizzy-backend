import { AggregateRoot } from 'src/core/domain/abstractions/aggregate.root';

import { Optional } from 'src/core/types/optional';

import { GroupId } from '../value-objects/group.id';
import { GroupDetails } from '../value-objects/group.details';
import { GroupAssignment } from '../entities/group.assignment';
import { GroupMember } from '../entities/group.member';
import { GroupAssignmentCompletion } from '../value-objects/group.assignment.completion';
import { InvitationToken } from '../value-objects/group.invitation.token';
import { Role } from '../value-objects/group.member.role';


//pending: revisar
import { GroupMemberRole } from '../value-objects/group.member.role';


//pending: eliminar al implementar la clase UserId
import { UuidVO } from 'src/core/domain/abstractions/vo.id';
class UserId extends UuidVO {
  constructor(value: string) {
    super(value);
  }
}

interface AttemptId {
  readonly value: string;
}

interface KahootId {
  readonly value: string;
}

interface GroupProps {
  details: GroupDetails;
  createdAt: Date;
  adminId: UserId;
  members: GroupMember[];
  assignments: GroupAssignment[];
  completions: GroupAssignmentCompletion[];
  invitationToken: Optional<InvitationToken>;
}

export class Group extends AggregateRoot<GroupProps, GroupId> {
  constructor(props: GroupProps, id: GroupId) {
    if (!props.details || !props.adminId) {
      throw new Error("Los detalles del grupo y el adminId son requeridos.");
    }
    super(props, id);
  }

  public updateDetails(requesterId: UserId, newDetails: GroupDetails): void {
    if (!this.isAdmin(requesterId)) {
      throw new Error("Solo el admin del grupo puede actualizar los detalles del grupo.");
    }
    this.properties.details = newDetails;
  }

  public generateInvitation(requesterId: UserId, expiresInDays: number): InvitationToken {
    //pending: revisar el tiempo y si hay que comprobar la regeneracion de la invitacion?
    
    if (!this.isAdmin(requesterId)) {
      throw new Error("Solo el admin del grupo puede generar invitaciones.");
    }

    if(expiresInDays < 1) {
      throw new Error("La invitación debe tener una duración mínima de 1 día.");
    }


    return InvitationToken.create(expiresInDays);
  }


  public joinGroup(group: Group, userToJoin: UserId, token: InvitationToken, isAdminPremium: boolean): void {
    if(this.isMember(userToJoin)) {
      throw new Error("El usuario ya es miembro del grupo.");
    }

    if((!isAdminPremium) && (this.properties.members.length >= 5)) {
      throw new Error("El grupo no puede tener más de 5 miembros si el admin no es premium.");
    }

    if((this.properties.invitationToken) && !token.equals(this.properties.invitationToken.getValue())) {
      throw new Error("La invitación no es válida.");
    }

    //pending: revisar
    this.properties.members.push(new GroupMember({userId: userToJoin, role: new Role(GroupMemberRole.MEMBER), joinedAt: new Date()}, userToJoin));

  }

  public removeMember(requesterId: UserId, targetUserId: UserId): void {

    // Solo el admin del grupo puede remover miembros, excepto si es el mismo usuario.
    if (!this.isAdmin(requesterId) && requesterId !== targetUserId) {
      throw new Error("Solo el admin del grupo puede remover miembros.");
    }
    if (!this.isMember(targetUserId)) {
      throw new Error("El usuario no es miembro del grupo.");
    }

    if (this.properties.adminId === targetUserId) {
      throw new Error("No se puede remover el admin del grupo.");
    }

    this.properties.members = this.properties.members.filter(member => member.getUserId() !== targetUserId);
  }



  public transferAdmin(requesterId: UserId, targetUserId: UserId, isAdminPremium: boolean): void {
    if (!this.isAdmin(requesterId)) {
      throw new Error("Solo el admin del grupo puede transferir el admin.");
    }
    if (!this.isMember(targetUserId)) {
      throw new Error("El usuario no es miembro del grupo.");
    }

    if (this.properties.adminId === targetUserId) {
      throw new Error("El usuario ya es admin del grupo.");
    }

    this.properties.adminId = targetUserId;
  }


  public assignKahoot(requesterId: UserId, assignedUser: UserId, kahootId: KahootId, from: Date, to: Date): void {
    if (!this.isMember(requesterId)) {
      throw new Error("Solo los miembros del grupo pueden asignar kahoots.");
    }

    if(from > to) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin.");
    }

    if(this.isKahootAssigned(kahootId)) {
      throw new Error("El kahoot ya está asignado al grupo.");
    }

    this.properties.assignments.push(
      new GroupAssignment({groupId: this.id, assignedBy: requesterId, userId: assignedUser, quizId: kahootId, availableFrom: from, availableUntil: to, isAssignmentCompleted: false}, 
        this.id)
      );

  }

  public markAssignmentAsCompleted(userId: UserId, kahootId: KahootId, attemptId: AttemptId): void {
    if (!this.isMember(userId)) {
      throw new Error("Solo los miembros del grupo pueden marcar asignaciones como completadas.");
    }


  //pending: implementar
  


  }

  public isKahootAssigned(kahootId: KahootId): boolean {
    return this.properties.assignments.some(assignment => assignment.getQuizId() === kahootId);
  }

  public deleteGroup(requesterId: UserId): void {
    if (!this.isAdmin(requesterId)) {
      throw new Error("Solo el admin del grupo puede eliminar el grupo.");
    }

    //pending: implementar la eliminacion del grupo
  }

  public isAdmin(userId: UserId): boolean {
    return this.properties.adminId === userId;
  }

  public isMember(userId: UserId): boolean {
    return this.properties.members.some(member => member.getUserId() === userId);
  }
  
  protected checkInvariants(): void {
    // TODO: Implementar validaciones de invariantes del agregado
  }
}

