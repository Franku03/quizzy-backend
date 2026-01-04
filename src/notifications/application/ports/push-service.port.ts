export interface IPushService {
    send(token: string, title: string, body: string): Promise<void>;
}