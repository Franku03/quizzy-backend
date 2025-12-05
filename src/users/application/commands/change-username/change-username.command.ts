export class ChangeUsernameCommand {
    constructor(
        public readonly userId: string,
        public readonly newUsername: string,
    ) {}
}