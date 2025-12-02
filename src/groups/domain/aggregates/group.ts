import { AggregateRoot } from 'src/core/domain/abstractions/aggregate.root';

import { Optional } from 'src/core/types/optional';

import { GroupId } from '../value-objects/group.id';
import { GroupDetails } from '../value-objects/group.details';
import { GroupAssignment } from '../entities/group.assignment';
import { GroupMember } from '../entities/group.member';
import { GroupMemberId } from '../value-objects/group.member.id';
import { GroupAssignmentCompletion } from '../value-objects/group.assignment.completion';
import { InvitationToken } from '../value-objects/group.invitation.token';
import { Role } from '../value-objects/group.member.role';
import { ITokenGenerator } from '../domain-services/i.token-generator.service.interface';
import { Score } from 'src/core/domain/shared-value-objects/value-objects/value.object.score';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';


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

interface AttemptId {
  readonly value: string;
}



export interface GroupPrimitives {
  id: string;
  name: string;
  description?: string;
  adminId: string;
  createdAt: Date;
  members: Array<{ id: string; role: string; joinedAt: Date }>;
  assignments: Array<{
    id: string;
    quizId: string;
    assignedBy: string;
    availableFrom: Date;
    availableUntil: Date;
    isAssignmentCompleted: boolean;
  }>;
  completions: Array<{
    userId: string;
    quizId: string;
    attemptId: string;
    score: number;
  }>;
  invitationToken: { value: string; expiresAt: Date } | null;
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
    if (!props.details || !props.adminId || !id) {
      throw new Error("Los detalles del grupo, el adminId y el id son requeridos.");
    }
    super(props, id);
  }

  public static create(
    groupId: string,
    name: string,
    adminId: string,
    description?: string,
  ): Group {
    const id = new GroupId(groupId);
    const details = GroupDetails.create(name, description);
    const admin = new UserId(adminId);
    const createdAt = new Date();

    // Crear el admin como primer miembro del grupo
    const adminMember = new GroupMember(
      {
        role: new Role(GroupMemberRole.ADMIN),
        joinedAt: createdAt,
        userId: admin,
      },
      new GroupMemberId(adminId)
    );

    const props: GroupProps = {
      details: GroupDetails.create(name, description),
      createdAt,
      adminId: admin,
      members: [adminMember],
      assignments: [],
      completions: [],
      invitationToken: new Optional<InvitationToken>(),
    };

    return new Group(props, id);
  }

  public updateDetails(requesterId: UserId, newDetails: GroupDetails): void {
    if (!this.isAdmin(requesterId)) {
      throw new Error("Solo el admin del grupo puede actualizar los detalles del grupo.");
    }
    this.properties.details = newDetails;
  }

  public generateInvitation(requesterId: UserId, tokenGenerator: ITokenGenerator, expiresInDays: number): InvitationToken {
    if (!this.isAdmin(requesterId)) {
      throw new Error("Solo el admin del grupo puede generar invitaciones.");
    }

    const token = InvitationToken.createWithTokenGenerator(tokenGenerator, expiresInDays);

    this.properties.invitationToken = new Optional(token);

    return token;
  }


  public joinGroup(userToJoin: UserId, token: InvitationToken, isAdminPremium: boolean): void {
    if (this.isMember(userToJoin)) {
      throw new Error("El usuario ya es miembro del grupo.");
    }

    if ((!isAdminPremium) && (this.properties.members.length >= 5)) {
      throw new Error("El grupo no puede tener más de 5 miembros si el admin no es premium.");
    }

    if ((this.properties.invitationToken) && !token.equals(this.properties.invitationToken.getValue())) {
      throw new Error("La invitación no es válida.");
    }

    //pending: revisar
    this.properties.members.push(new GroupMember({ userId: userToJoin, role: new Role(GroupMemberRole.MEMBER), joinedAt: new Date() }, userToJoin));

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

    if (from > to) {
      throw new Error("La fecha de inicio debe ser anterior a la fecha de fin.");
    }

    if (this.isKahootAssigned(kahootId)) {
      throw new Error("El kahoot ya está asignado al grupo.");
    }

    this.properties.assignments.push(
      new GroupAssignment({ groupId: this.id, assignedBy: requesterId, quizId: kahootId, availableFrom: from, availableUntil: to, isAssignmentCompleted: false },
        this.id)
    );

  }

  public markAssignmentAsCompleted(userId: UserId, kahootId: KahootId, attemptId: AttemptId, score: Score): boolean {
    if (!this.isMember(userId)) {
      throw new Error("Solo los miembros del grupo pueden marcar asignaciones como completadas.");
    }

    const assignment = this.properties.assignments.find(
      assignment => assignment.getQuizId().value === kahootId.value
    );

    if (!assignment) {
      throw new Error("El kahoot no está asignado a este grupo.");
    }

    const existingCompletion = this.properties.completions.find(
      completion =>
        completion.getUserId().value === userId.value &&
        completion.getQuizId().value === kahootId.value
    );

    if (existingCompletion)
      // Ya existe una completion para este usuario y quiz, no hacer nada
      // Los siguientes intentos pueden jugarse pero no se registran en el assignment
      return false;


    const completion = GroupAssignmentCompletion.create(
      userId,
      kahootId,
      attemptId,
      score
    );

    this.properties.completions.push(completion);


    assignment.markAsCompleted();


    return true;
  }

  public isKahootAssigned(kahootId: KahootId): boolean {
    return this.properties.assignments.some(
      assignment => assignment.getQuizId().value === kahootId.value
    );
  }

  public deleteGroup(requesterId: UserId): void {
    if (!this.isAdmin(requesterId)) {
      throw new Error("Solo el admin del grupo puede eliminar el grupo.");
    }

    //pending: implementar la eliminacion del grupo (mediante repositorio)
  }

  public isAdmin(userId: UserId): boolean {
    return this.properties.adminId === userId;
  }

  public isMember(userId: UserId): boolean {
    return this.properties.members.some(member => member.getUserId() === userId);
  }

  protected checkInvariants(): void {
  }

  public getAdminId(): UserId {
    return this.properties.adminId;
  }

  public getName(): string {
    return this.properties.details.getName();
  }

public toPrimitives(): GroupPrimitives {
    return {
      id: this.id.value,
      name: this.properties.details.getName(),
      description: this.properties.details.getDescription ? this.properties.details.getDescription() : undefined,
      adminId: this.properties.adminId.value,
      createdAt: this.properties.createdAt,
      
      
      members: this.properties.members.map(member => member.toPrimitives()),
      
      assignments: this.properties.assignments.map(assignment => assignment.toPrimitives()),


      completions: this.properties.completions.map(completion => completion.toPrimitives()),


      invitationToken: this.properties.invitationToken.hasValue() ? {
        value: this.properties.invitationToken.getValue().getValue(),
        expiresAt: this.properties.invitationToken.getValue().getExpiresAt()
      } : null
    };
  }
}


