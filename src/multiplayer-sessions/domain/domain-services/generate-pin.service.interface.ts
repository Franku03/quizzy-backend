// Este servicio como contrato debe implementarse en infraestructura para generar el ID mediante la libreria crypto de Node.js
export interface IGeneratePinService {

    generatePin(): string
}