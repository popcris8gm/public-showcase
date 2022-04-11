export interface ServerConnectionConfig {
    port: number;
    sizeLimit?: number,
    host?: string | Array<string>,
    ssl?: {
        keyPath: string,
        certPath: string
    } 
}