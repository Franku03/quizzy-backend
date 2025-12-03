import * as fs from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { IPinRepository } from 'src/multiplayer-sessions/domain/ports';

@Injectable()
export class FileSystemPinRepository implements IPinRepository {

    private readonly PIN_FILE_PATH = 'active_pins.txt'

    public async getActivePins(): Promise<Set<string>> {
        try {
            // Reads the file content as a string
            const fileContent = await fs.readFile(this.PIN_FILE_PATH, { encoding: 'utf-8' });
            
            // Splits the content by newline, filters out empty lines, and returns a Set for fast lookups
            const activePins = new Set(
                fileContent.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
            );

            return activePins;

        } catch (error: any) {
            // If the file doesn't exist (ENOENT), return an empty Set, which is fine.
            if (error.code === 'ENOENT') {
                return new Set<string>();
            }
            // Re-throw any other file system errors
            throw error;
        }
    }

    public async saveNewPin(pin: string): Promise<void> {
        // Appends the new PIN followed by a newline to the file
        await fs.appendFile(this.PIN_FILE_PATH, `${pin}\n`, { encoding: 'utf-8' });
    }


    public async releasePin(pinToRemove: string): Promise<void> {
        try {
            // 1) Leer todo el contenido del archivo
            const fileContent = await fs.readFile(this.PIN_FILE_PATH, { encoding: 'utf-8' });

            // 2) Dividir el contenido en un array de líneas/PINs
            // .split('\n'): Divide por salto de línea.
            // .map(line => line.trim()): Elimina espacios en blanco.
            // .filter(line => line.length > 0): Filtra líneas vacías.
            let activePins = fileContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            // 3) Filtrar y eliminar el PIN deseado
            // Utilizamos filter para crear un nuevo array que NO contenga el pinToRemove.
            const updatedPins = activePins.filter(pin => pin !== pinToRemove);

            // 4) Verificar si hubo un cambio
            if (updatedPins.length === activePins.length) {
                console.warn(`Warning: PIN ${pinToRemove} was not found in the active pins file.`);
                return; // El PIN no estaba en el archivo, no hay que hacer nada.
            }

            // 5) Unir el array actualizado de nuevo en un string con saltos de línea
            const newFileContent = updatedPins.join('\n') + '\n';
            
            // 6) Escribir el nuevo contenido de vuelta al archivo (sobrescribiendo el anterior)
            // El uso de fs.writeFile es más seguro para sobrescribir que appendFile.
            await fs.writeFile(this.PIN_FILE_PATH, newFileContent, { encoding: 'utf-8' });

            console.log(`✅ PIN ${pinToRemove} successfully released.`);

        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.error(`Error: PIN file not found at ${this.PIN_FILE_PATH}. Cannot release PIN ${pinToRemove}.`);
                return;
            }
            throw error; // Re-lanzar otros errores del sistema de archivos
        }
    }


}