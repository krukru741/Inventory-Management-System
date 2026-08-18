export declare class AuthResponseDto {
    accessToken: string;
    expiresIn: string;
    user: {
        id: string;
        email: string;
        role: string;
        name: string;
    };
}
