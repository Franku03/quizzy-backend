import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { Inject } from '@nestjs/common';
import { GetUserProfileQuery } from './get-user-profile.query';
import { UserProfileReadModel } from '../read-model/get-user-profile.model';
import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { UserOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/userOwnership.strategy';

@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler implements IQueryHandler<GetUserProfileQuery> {
  
  constructor(
    @Inject(RepositoryName.User)
    public readonly userRepo: IUserRepository,
    private readonly mediaEnrichmentService: MediaEnrichmentService,
  ) {}

  @Authorize(UserOwnershipAuthorizer, 'userRepo')
  async execute(query: GetUserProfileQuery): Promise<Either<ErrorData, UserProfileReadModel>> {
    const userId = new UserId(query.userId);
    const userOptional = await this.userRepo.findById(userId);

    if (!userOptional.hasValue()) {
      return Either.makeLeft(
        new ErrorData('RESOURCE_NOT_FOUND', 'Usuario no encontrado', ErrorLayer.DOMAIN)
      );
    }

    const user = userOptional.getValue();

    const readModel = new UserProfileReadModel(
      user.id.value,
      user.email.value,
      user.username.value,
      user.type,
      user.state,
      user.roles,
      user.isAdmin(),
      {
        theme: user.userPreferences.themePreference,
      },
      {
        name: user.userProfileDetails.name,
        description: user.userProfileDetails.description,
        avatarAssetId: user.userProfileDetails.avatarAssetId,
      }
    );

    await this.mediaEnrichmentService.enrich(readModel);

    return Either.makeRight(readModel);
  }
}