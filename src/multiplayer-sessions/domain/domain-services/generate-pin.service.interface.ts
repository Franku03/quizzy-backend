import { Either, ErrorData } from "src/core/types";

// Este servicio como contrato debe implementarse en infraestructura para generar el ID mediante la libreria crypto de Node.js
export interface IGeneratePinService {

    generateUniquePin(): Promise<Either<ErrorData,string>>;
    
}