import { ErrorData } from "../error.type";

export function isErrorData(error: any): error is ErrorData {
    return error instanceof ErrorData;
}