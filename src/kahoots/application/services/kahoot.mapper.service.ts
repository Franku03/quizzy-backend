// src/kahoots/application/services/kahoot.mapper.service.ts
import { Injectable } from '@nestjs/common';
import { IKahootMapper } from '../ports/i-kahoot-mapper.port';
import { KahootSnapshot } from 'src/core/domain/snapshots/snpapshot.kahoot';
import { KahootHandlerResponse } from '../response/kahoot.handler.response';
import { SlideHandlerResponse } from '../response/kahoot.slide.handler.response';
import { OptionHandlerResponse } from '../response/kahoot.slide.option.handler.response';
import { MapperHelper } from 'src/kahoots/infrastructure/adapters/helpers/kahoot.mapper.helper';
import { SlideSnapshot } from 'src/core/domain/snapshots/snapshot.slide';
import { OptionSnapshot } from 'src/core/domain/snapshots/snapshot.option';

@Injectable()
export class KahootMapperService implements IKahootMapper {
  public async fromSnapshot(snapshot: KahootSnapshot): Promise<KahootHandlerResponse> {
    const response = new KahootHandlerResponse();
    const details = snapshot.details;
    const styling = snapshot.styling;
    
    // Asignar valores básicos
    response.id = snapshot.id;
    response.authorId = snapshot.authorId;
    response.createdAt = snapshot.createdAt;
    response.playCount = snapshot.playCount;
    response.status = MapperHelper.capitalizeFirstLetter(snapshot.status)!;
    response.visibility = MapperHelper.capitalizeFirstLetter(snapshot.visibility)!;
    response.themeId = styling?.themeId ?? null;
    response.coverImageId = styling?.imageId ?? null;
    
    // Detalles
    response.title = details?.title ?? null;
    response.description = details?.description ?? null;
    response.category = details?.category ?? null;
    
    // Mapear slides - CONVERSIÓN EXPLÍCITA
    const slides = snapshot.slides ?? null; // Convierte undefined a null
    response.questions = this.mapSlides(slides);

    return response;
  }

  // ========== MÉTODOS HELPER ==========

  private mapSlides(slides: SlideSnapshot[] | null): SlideHandlerResponse[] | null {
    // Ahora solo acepta SlideSnapshot[] | null
    if (!slides || slides.length === 0) return null;

    return slides.map((slide): SlideHandlerResponse => {
      const slideResponse = new SlideHandlerResponse();
      
      slideResponse.id = slide.id;
      slideResponse.text = slide.questionText ?? null;
      slideResponse.mediaId = slide.slideImageId ?? null;
      slideResponse.type = slide.slideType.toLowerCase();
      slideResponse.timeLimit = slide.timeLimitSeconds;
      slideResponse.points = slide.pointsValue ?? null;
      slideResponse.position = slide.position;
      slideResponse.answers = this.mapOptions(slide.options); // Esto también puede necesitar ajuste

      return slideResponse;
    });
  }

  private mapOptions(options?: OptionSnapshot[] | null): OptionHandlerResponse[] | null {
    // Acepta undefined también
    if (!options || options.length === 0) return null;

    return options.map((opt, index): OptionHandlerResponse => {
      const optionResponse = new OptionHandlerResponse();
      
      optionResponse.id = index.toString();
      optionResponse.text = opt.optionText ?? null;
      optionResponse.mediaId = opt.optionImageId ?? null;
      optionResponse.isCorrect = opt.isCorrect;

      return optionResponse;
    });
  }
}