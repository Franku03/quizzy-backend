/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\adapters\file-system.pin.repository.ts

import * as fs from 'fs/promises';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { IPinRepository } from 'src/multiplayer-sessions/domain/ports';
import { Either, ErrorData } from 'src/core/types';
import { FileSystemPinRepositoryErrorContext, FileSystemPinRepositoryErrorMapper } from '../errors/file-system-pin-repository.error.mapper';
import { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { IInfrastructureErrorContext } from 'src/core/errors/interface/context/i-error-infraestructure-context.interface';

@Injectable()
export class FileSystemPinRepository implements IPinRepository, OnModuleInit {

    private readonly PIN_FILE_PATH = 'active_pins.txt'
    private readonly memoryCache = new Set<string>();
    private readonly errorMapper: IErrorMapper<unknown, IInfrastructureErrorContext> = new FileSystemPinRepositoryErrorMapper()
    
    private getCtx( operation: string, pin?: string ): FileSystemPinRepositoryErrorContext {
        return {
            operation: operation,
            sessionPin: pin,
            adapterName: FileSystemPinRepository.name,
            portName: 'IPinRepository',
            module: "multiplayer-sessions"
        }
    }

    // Monta en cache los pins que hayan quedado anteriormente en la sesión cuando se inicia la aplicación
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
                console.error(`❌ Error: PIN no encontrado en ${this.PIN_FILE_PATH}. No se puede liberar el PIN ${pinToRemove}.`);
                return;
            }
            throw error; // Re-lanzar otros errores del sistema de archivos
        }
    }

    public async getActivePinsEither(): Promise< Either< ErrorData, Set<string> > >{

        const ctx = this.getCtx('getActivePins');

        return Either.tryCatch( 
            this.getActivePins(), 
            ( err ) => this.errorMapper.toErrorData( err , ctx ) 
        );

    }

    public async saveNewPinEither(pin: string): Promise< Either< ErrorData, void >> {

        const ctx = this.getCtx('saveNewPin');

        return Either.tryCatch(
            this.saveNewPin( pin ),
            ( err ) => this.errorMapper.toErrorData( err , ctx ) 
        )

    }

    public async releasePinEither(pinToRemove: string): Promise< Either< ErrorData, void> >{
        const ctx = this.getCtx('releasePin');

        return Either.tryCatch(
            this.releasePin( pinToRemove ),
            ( err ) => this.errorMapper.toErrorData( err , ctx ) 
        );

    }

}