import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { Inject } from '@nestjs/common';
import { GetPublicProfileQuery } from './get-public-profile.query';
import { Either } from 'src/core/types/either';
import { ErrorData, ErrorLayer } from 'src/core/types';
import type { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

@QueryHandler(GetPublicProfileQuery)
export class GetPublicProfileHandler implements IQueryHandler<GetPublicProfileQuery> {
  constructor(
    @Inject(RepositoryName.User) 
    private readonly userRepo: IUserRepository,
    private readonly mediaService: MediaEnrichmentService, 
  ) {}

  async execute(query: GetPublicProfileQuery): Promise<Either<ErrorData, any>> {
    const userOptional = await this.userRepo.findById(new UserId(query.targetUserId));
    
    if (!userOptional.hasValue()) {
      return Either.makeLeft(new ErrorData('RESOURCE_NOT_FOUND', 'User not found', ErrorLayer.DOMAIN));
    }
    const user = userOptional.getValue();

    const response = {
      id: user.id.value,
      username: user.username.value,
      type: user.type,
      userProfileDetails: {
          name: user.userProfileDetails.name,
          description: user.userProfileDetails.description,
          avatarAssetId: user.userProfileDetails.avatarAssetId,
          avatarUrl: null
      },
      isPremium: user.isUserPremium(),
      
      getMediaAssetIds() {
        return this.userProfileDetails.avatarAssetId ? [this.userProfileDetails.avatarAssetId] : [];
      },
      applyMediaUrls(urlMap: Map<string, string>) {
        this.userProfileDetails.avatarUrl = urlMap.get(this.userProfileDetails.avatarAssetId) || null;
      }
    };

    await this.mediaService.enrich(response);

    return Either.makeRight(response);
  }
}