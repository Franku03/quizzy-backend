
// Este servicio como contrato debe implementarse en infraestructura para conectar con la BD y verificar que el PIN no se encuentre activo para una sesión activa
export interface IVerifyAvailablePinService {

    verifyPin(pin: string): boolean

}