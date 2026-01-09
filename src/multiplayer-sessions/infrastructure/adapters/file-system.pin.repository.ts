import * as fs from 'fs/promises';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { IPinRepository } from 'src/multiplayer-sessions/domain/ports';

@Injectable()
export class FileSystemPinRepository implements IPinRepository, OnModuleInit {

    private readonly PIN_FILE_PATH = 'active_pins.txt'
    private readonly memoryCache = new Set<string>();

    async onModuleInit() {
        try {
            const fileContent = await fs.readFile(this.PIN_FILE_PATH, { encoding: 'utf-8' });
            fileContent.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .forEach(pin => this.memoryCache.add(pin));
        } catch (error: any) {
            if (error.code !== 'ENOENT') throw error;
        }
    }

    public async getActivePins(): Promise<Set<string>> {
        return new Set(this.memoryCache);
    }

    public async saveNewPin(pin: string): Promise<void> {
        this.memoryCache.add(pin);
        // Appends the new PIN followed by a newline to the file
        await fs.appendFile(this.PIN_FILE_PATH, `${pin}\n`, { encoding: 'utf-8' });
    }

    public async releasePin(pinToRemove: string): Promise<void> {
        try {
            if (!this.memoryCache.has(pinToRemove)) {
                console.warn(`Warning: PIN ${pinToRemove} no se encuentra en el registro de pins activos.`);
                return; // El PIN no estaba en el archivo, no hay que hacer nada.
            }

            this.memoryCache.delete(pinToRemove);

            // 1) Leer todo el contenido del archivo
            // 2) Dividir el contenido en un array de líneas/PINs
            // 3) Filtrar y eliminar el PIN deseado
            // 4) Verificar si hubo un cambio
            
            // 5) Unir el array actualizado de nuevo en un string con saltos de línea
            const newFileContent = Array.from(this.memoryCache).join('\n') + (this.memoryCache.size > 0 ? '\n' : '');
            
            // 6) Escribir el nuevo contenido de vuelta al archivo (sobrescribiendo el anterior)
            // El uso de fs.writeFile es más seguro para sobrescribir que appendFile.
            await fs.writeFile(this.PIN_FILE_PATH, newFileContent, { encoding: 'utf-8' });

            console.log(`✅ PIN ${pinToRemove} liberado exitosamente.`);

        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.error(`Error: PIN no encontrado en ${this.PIN_FILE_PATH}. No se puede liberar el PIN ${pinToRemove}.`);
                return;
            }
            throw error; // Re-lanzar otros errores del sistema de archivos
        }
    }
}