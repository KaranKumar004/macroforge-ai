export interface ColumnMetadata {
    name: string;
    type: "string" | "number" | "boolean" | "date" | "unknown";
    sample?: any;
}

export interface FileMetadata {
    filename: string;
    size: number;
    sheetNames: string[];
    columns: ColumnMetadata[];
}
