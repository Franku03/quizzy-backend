import { Group } from '../../domain/aggregates/group';
import { GroupMongo } from 'src/database/infrastructure/entities/mongo/groups/groups.schema';
import { GroupId } from '../../domain/value-objects/group.id';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { GroupMemberId } from '../../domain/value-objects/group.member.id';
import { GroupDetails } from '../../domain/value-objects/group.details';
import { Role } from '../../domain/value-objects/group.member.role';
import { InvitationToken } from '../../domain/value-objects/group.invitation.token';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { Score } from 'src/core/domain/shared-value-objects/value-objects/value.object.score';
import { AttemptId } from 'src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id';
import { GroupMember } from '../../domain/entities/group.member';
import { GroupAssignment } from '../../domain/entities/group.assignment';
import { GroupAssignmentCompletion } from '../../domain/value-objects/group.assignment.completion';
import { Optional } from 'src/core/types/optional';

export class GroupMapper {

  static toDomain(raw: GroupMongo): Group {
    const groupId = new GroupId(raw.groupId);
    const adminId = new UserId(raw.adminId);
    const details = GroupDetails.create(raw.name, raw.description);
    const createdAt = raw.createdAt ? new Date(raw.createdAt) : new Date();

    const members = (raw.members || []).map((m: any) => {
      return new GroupMember(
        {
          userId: new UserId(m.userId),
          role: new Role(m.role),
          joinedAt: new Date(m.joinedAt),
        },
        new GroupMemberId(m.id)
      );
    });

    const assignments = (raw.assignments || []).map((a: any) => {
      return new GroupAssignment(
        {
          groupId: groupId,
          assignedBy: new UserId(a.assignedBy),
          quizId: new KahootId(a.quizId),
          availableFrom: new Date(a.availableFrom),
          availableUntil: new Date(a.availableUntil),
          isAssignmentCompleted: a.isAssignmentCompleted ?? false,
        },
         a.id 
      );
    });

    const completions = (raw.completions || []).map((c: any) => {
      const attemptId = new AttemptId(c.attemptId);
      
      return GroupAssignmentCompletion.create(
        new UserId(c.userId),
        new KahootId(c.quizId),
        attemptId,
        Score.create(c.score)
      );
    });

    let invitationToken = new Optional<InvitationToken>();
    
    if (raw.invitationToken && raw.invitationToken.value) {

      const token = InvitationToken.create(
        raw.invitationToken.value, 
        new Date(raw.invitationToken.expiresAt)
      );

      invitationToken = new Optional(token);
    }

    return new Group(
      {
        details,
        createdAt,
        adminId,
        members,
        assignments,
        completions,
        invitationToken,
      },
      groupId
    );
  }

  static toPersistence(group: Group): any {
    const primitives = group.toPrimitives();

    return {
      groupId: primitives.id,
      adminId: primitives.adminId,
      name: primitives.name,
      description: primitives.description,
      createdAt: primitives.createdAt,
      
      members: primitives.members.map(m => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt
      })),

      assignments: primitives.assignments.map(a => ({
        id: a.id,
        quizId: a.quizId,
        assignedBy: a.assignedBy,
        availableFrom: a.availableFrom,
        availableUntil: a.availableUntil,
        isAssignmentCompleted: a.isAssignmentCompleted
      })),

      completions: primitives.completions.map(c => ({
        userId: c.userId,
        quizId: c.quizId,
        attemptId: c.attemptId,
        score: c.score
      })),

      invitationToken: primitives.invitationToken 
        ? {
            value: primitives.invitationToken.value,
            expiresAt: primitives.invitationToken.expiresAt
          }
        : null
    };
  }
}