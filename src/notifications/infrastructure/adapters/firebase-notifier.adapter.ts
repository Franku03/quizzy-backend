import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { INotifier } from '../../application/ports/notifier.port';

@Injectable()
export class FirebaseNotifierAdapter implements INotifier, OnModuleInit {
    private readonly logger = new Logger(FirebaseNotifierAdapter.name);
    private isInitialized = false;
    private isConfigured = false;

    onModuleInit() {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            this.logger.warn(
                'Firebase credentials not configured. Push notifications will be disabled. ' +
                'Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables to enable.'
            );
            this.isConfigured = false;
            return;
        }

        this.isConfigured = true;

        if (!admin.apps.length) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey: privateKey.replace(/\\n/g, '\n'),
                    }),
                });
                this.isInitialized = true;
                this.logger.log('Firebase Admin initialized successfully');
            } catch (error) {
                this.logger.error('Failed to initialize Firebase Admin:', error);
                this.isInitialized = false;
            }
        } else {
            this.isInitialized = true;
        }
    }

    async sendToUser(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
        if (tokens.length === 0) return;

        if (!this.isConfigured || !this.isInitialized) {
            this.logger.debug(
                `Push notification skipped: Firebase not configured or initialized. ` +
                `Title: "${title}", Body: "${body}"`
            );
            return;
        }

        try {
            await admin.messaging().sendEachForMulticast({
                tokens,
                notification: { title, body },
                data: data || {}
            });
            this.logger.debug(`Push notification sent successfully to ${tokens.length} device(s)`);
        } catch (error: any) {
            if (error?.code?.includes('network-error') || error?.code?.includes('ENOTFOUND')) {
                this.logger.warn(
                    `Firebase network error: Cannot connect to FCM. Check your internet connection and DNS settings. ` +
                    `Error: ${error.message}`
                );
            } else if (error?.code?.includes('messaging/invalid-argument')) {
                this.logger.warn(`Firebase invalid argument error: ${error.message}`);
            } else if (error?.code?.includes('messaging/invalid-registration-token')) {
                this.logger.warn(`Firebase invalid token error: Some device tokens are invalid`);
            } else {
                this.logger.error('Firebase send error:', error);
            }
        }
    }
}