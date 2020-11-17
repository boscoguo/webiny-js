type SecurityIdentityData = {
    id: string;
    type: string;
    [key: string]: any;
};

export class SecurityIdentity {
    id: string;
    type: string;
    constructor(data: SecurityIdentityData) {
        Object.assign(this, data);
    }
}
