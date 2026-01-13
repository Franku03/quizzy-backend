import { mock, MockProxy } from 'jest-mock-extended';
import { Either, ErrorData } from 'src/core/types';

// --- Capa de Dominio & DTOs (Modelos de Lectura) ---
import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';

// --- Capa de Aplicación (SUT y Puertos) ---
import { GetKahootUserDetailHandler } from 'src/kahoots/application/queries/get-kahoot-preview-by-id/get-kahoot-user-detail-by-id.handler';
import { IKahootDao } from 'src/kahoots/application/ports/i-kahoot.dao.interface';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';

// --- Object Mothers ---
import { KahootUserDetailMother } from 'test/kahoots/object-mothers/application/dtos/kahoot-user-detail.read.model.dto.mother';
import { GetKahootUserDetailQueryMother, SecureDetailQuery } from 'test/kahoots/object-mothers/application/queries/get-kahoot-user-detail.query.mother';

/**
 * API de soporte para las pruebas unitarias del caso de uso de get kahoot user detail.
 */
export class GetKahootUserDetailTestAPI {
    private daoMock: MockProxy<IKahootDao> = mock<IKahootDao>();
    private mediaMock: MockProxy<MediaEnrichmentService> = mock<MediaEnrichmentService>();
    private loggerMock: MockProxy<ILogger> = mock<ILogger>();

    private result?: Either<ErrorData, KahootUserDetailReadModel>;
    private currentQuery?: SecureDetailQuery;
    private existingReadModel?: KahootUserDetailReadModel;

    constructor() {
        this.configureDefaultMocks();
    }

    private configureDefaultMocks(): void {
        this.mediaMock.enrich.mockImplementation(async (readModel) => readModel);
        this.loggerMock.error.mockImplementation(() => { });
    }

    // ============ GIVEN: Escenarios de Estado ============

    /**
     * Prepara un modelo de lectura (ReadModel) válido de detalles de Kahoot.
     */
    public givenAnExistingUserDetailReadModel(): this {
        this.existingReadModel = KahootUserDetailMother.valid();
        return this;
    }

    /**
     * Configura la Query con el recurso validado inyectado y sus identificadores.
     * La creación de la query se delega al Mother internamente.
     */
    public givenAValidGetDetailQuery(): this {
        if (!this.existingReadModel) throw new Error("Falta: givenAnExistingUserDetailReadModel()");
        
        // Se hace AQUÍ adentro, la API orquesta a los Mothers
        this.currentQuery = GetKahootUserDetailQueryMother.valid(this.existingReadModel);

        return this;
    }

    // ============ WHEN: Ejecución de la Query (SUT) ============

    public async whenExecutingQuery(): Promise<this> {
        const handler = new GetKahootUserDetailHandler(this.mediaMock, this.loggerMock, this.daoMock);
        if (!this.currentQuery) throw new Error("Falta configurar la Query");
        
        this.result = await handler.execute(this.currentQuery);
        return this;
    }

    // ============ THEN: Verificaciones ============

    public thenShouldReturnUserDetail(): void {
        expect(this.result?.isRight()).toBe(true);
        expect(this.mediaMock.enrich).toHaveBeenCalled();
        expect(this.result?.getRight()?.id).toBe(this.existingReadModel?.id);
    }
}