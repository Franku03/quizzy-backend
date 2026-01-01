// src/kahoots/infrastructure/persistence/mappers/kahoot-read.mapper.ts
import { Injectable } from '@nestjs/common';
import { KahootHandlerResponse } from 'src/kahoots/application/response/kahoot.handler.response';
import { SlideHandlerResponse } from 'src/kahoots/application/response/kahoot.slide.handler.response';
import { OptionHandlerResponse } from 'src/kahoots/application/response/kahoot.slide.option.handler.response';

@Injectable()
export class KahootReadMapper {
  
  mapDocumentToResponse(document: any): KahootHandlerResponse {
    const response = new KahootHandlerResponse();
    
    response.id = document.id;
    response.authorId = document.authorId;
    response.createdAt = document.createdAt.toISOString().split('T')[0] 
    response.playCount = document.playCount;

    response.status = this.capitalize(document.status);
    response.visibility = this.capitalize(document.visibility);

    response.themeId = document.styling?.themeId;
    response.coverImageId = document.styling?.imageId ?? null;
    
    response.title = document.details?.title ?? null;
    response.description = document.details?.description ?? null;
    response.category = document.details?.category ?? null;
    
    response.questions = document.slides 
      ? this.mapSlides(document.slides)
      : null;

    return response;
  }

  private mapSlides(slides: any[]): SlideHandlerResponse[] {
    return slides.map((slide) => {
      const slideResponse = new SlideHandlerResponse();
      
      slideResponse.id = slide.id;
      slideResponse.text = slide.questionText ?? null;
      slideResponse.mediaId = slide.slideImageId ?? null;
      slideResponse.type = slide.slideType?.toLowerCase() ?? null;

      slideResponse.timeLimit = slide.timeLimitSeconds;
      slideResponse.points = slide.pointsValue ?? null;
      slideResponse.position = slide.position;
      slideResponse.answers = this.mapOptions(slide.options);

      return slideResponse;
    });
  }

  private mapOptions(options: any[] | null | undefined): OptionHandlerResponse[] | null {
    if (!options || options.length === 0) return null;

    return options.map((option, index) => {
      const optionResponse = new OptionHandlerResponse();
      
      optionResponse.id = option.id || index.toString();
      optionResponse.text = option.optionText ?? null;
      optionResponse.mediaId = option.optionImageId ?? null;
      optionResponse.isCorrect = option.isCorrect ?? false;

      return optionResponse;
    });
  }
  
  private capitalize(text: string): string {
    if (!text) return text;
    const lower = text.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
}