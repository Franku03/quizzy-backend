export interface IDeviceRepository {
    register(userId: string, token: string, deviceType: string): Promise<void>;
    remove(userId: string, token: string): Promise<void>;
    findTokensByUserId(userId: string): Promise<string[]>;
}