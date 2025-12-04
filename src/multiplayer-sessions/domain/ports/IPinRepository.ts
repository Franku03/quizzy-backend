

// Exclusivamente para manejar operaciones sobre el lugar donde se persista el PIN, en nuestro caso sera en el file system
export interface IPinRepository {

    getActivePins(): Promise<Set<string>>;
    saveNewPin(pin: string): Promise<void>;
    releasePin(pinToRemove: string): Promise<void> 

}