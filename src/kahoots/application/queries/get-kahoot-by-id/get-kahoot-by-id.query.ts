interface GetKahootByIdProps {
    kahootId: string;
    userId: string | undefined;
}

export class GetKahootByIdQuery {
    public readonly kahootId: string;
    public readonly userId?: string;
    constructor(props: GetKahootByIdProps) {
        Object.assign(this, props);
    }
}