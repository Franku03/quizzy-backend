import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { INotifier } from '../../application/ports/notifier.port';

@Injectable()
export class FirebaseNotifierAdapter implements INotifier, OnModuleInit {
    onModuleInit() {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        }
    }

    async sendToUser(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
        if (tokens.length === 0) return;
        try {
            await admin.messaging().sendEachForMulticast({
                tokens,
                notification: { title, body },
                data
            });
        } catch (error) {
            console.error('Firebase send error:', error);
        }
    }
}