import { $isAppError, AppError } from "./appContracts";

export function toAppError(err: any, source?: string, timestamp?: string, properties?: Record<string | number, any>): AppError {
    if (!timestamp) {
        timestamp = localTimeAsUtcISOString();
    }
    if (err instanceof Error) {
        return {
            message: err.message,
            name: err.name,
            type: err.name,
            stack: err.stack,
            source: source,
            timestamp: timestamp,
            cause: toAppError(err.cause),
            properties,
            [$isAppError]: true
        }
    } else {
        return {
            message: err.message || err.toString(),
            name: err.name,
            type: err.type,
            detail: JSON.stringify(err),
            stack: err.stack,
            source: err.source || source,
            timestamp: timestamp,
            cause: toAppError(err.cause),
            properties,
            [$isAppError]: true
        }
    }
}

export function isAppError(err: any): err is AppError {
    return err && err[$isAppError] === true;
}


function localTimeAsUtcISOString(date = new Date()) {
    const pad = n => String(n).padStart(2, "0");

    return (
        date.getFullYear() + "-" +
        pad(date.getMonth() + 1) + "-" +
        pad(date.getDate()) + "T" +
        pad(date.getHours()) + ":" +
        pad(date.getMinutes()) + ":" +
        pad(date.getSeconds()) + "." +
        String(date.getMilliseconds()).padStart(3, "0") +
        "Z"
    );
}