export interface INotifier {
    sendToUser(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void>;
}