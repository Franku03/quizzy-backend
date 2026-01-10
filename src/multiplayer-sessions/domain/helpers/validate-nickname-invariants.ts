import { MAX_NICKNAME_TEXT_LENGTH, MIN_NICKNAME_TEXT_LENGTH } from "../constants/player-constants";

interface Validation {
    isValid: boolean,
    cleanNickname: string 
    errorMessage?: string,
}

export const validateNicknameInvariants = (nickname: string): Validation  => {

        const cleanNickname = nickname ? nickname.trim() : "";

        if( cleanNickname.length === 0 )
            return { isValid: false, cleanNickname, errorMessage: "El nickname del usuario no puede estar vacío" }
        
        if( cleanNickname.length > MAX_NICKNAME_TEXT_LENGTH )
            return { isValid: false, cleanNickname, errorMessage: `La longitud del nickname NO puede superar los ${ MAX_NICKNAME_TEXT_LENGTH } caracteres.`}

        if( cleanNickname.length < MIN_NICKNAME_TEXT_LENGTH )
            return { isValid: false, cleanNickname, errorMessage: `La longitud del nickname DEBE ser superior a los ${ MIN_NICKNAME_TEXT_LENGTH } caracteres.`}

        return { isValid: true, cleanNickname, errorMessage: undefined };

}