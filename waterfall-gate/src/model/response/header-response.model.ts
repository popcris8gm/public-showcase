export class HeaderResponse {
    public data: any;
    public headers: Array<HeaderResponseItem>;

    constructor(data?: any, headers?: Array<HeaderResponseItem>) {
        this.data = data;
        this.headers = headers;
    }
}

export class HeaderResponseItem {
    public key: string;
    public value: any;

    constructor(key?: string, value?: any) {
        this.key = key;
        this.value = value;
    }
}