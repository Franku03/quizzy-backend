import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot'; // Entidad de Dominio
import { KahootResponseDTO } from '../response-dto/kahoot.response.dto';

export interface IKahootResponseMapper {
    toResponseDTO(domainEntity: Kahoot): KahootResponseDTO;
}