import { $isAppError, type AppError } from "./commonContracts";

export function toAppError(err: undefined | null, source?: string, timestamp?: string, properties?: Record<string | number, any>): undefined;
export function toAppError(err: any, source?: string, timestamp?: string, properties?: Record<string | number, any>): AppError;
export function toAppError(err: any, source?: string, timestamp?: string, properties?: Record<string | number, any>): AppError | undefined {
    if (err === undefined || err === null) {
        return undefined;
    }
    if (isAppError(err)) {
        return err;
    }
    if (!timestamp) {
        timestamp = localTimeAsUtcISOString();
    }

    const extraProperties: Record<string | number, any> = {};
    if (err.status !== undefined) {
        extraProperties.status = err.status;
    }
    if (err.code !== undefined) {
        extraProperties.code = err.code;
    }
    if (err.params !== undefined) {
        extraProperties.params = err.params;
    }
    const combinedProperties =
        properties || Object.keys(extraProperties).length > 0
            ? { ...properties, ...extraProperties }
            : undefined;

    if (err instanceof Error) {
        return {
            message: err.message,
            name: err.name,
            type: (err as any).code || err.name,
            stack: err.stack,
            source: source,
            timestamp: timestamp,
            cause: err.cause ? toAppError(err.cause) : undefined,
            properties: combinedProperties,
            [$isAppError]: true
        };
    } else {
        let message: string;
        if (typeof err === "string") {
            message = err;
        } else if (typeof err?.message === "string" && err.message) {
            message = err.message;
        } else if (typeof err?.error === "string" && err.error) {
            message = err.error;
        } else {
            try {
                message = JSON.stringify(err);
            } catch {
                message = String(err);
            }
        }

        let detail: string | undefined = undefined;
        if (typeof err === "object") {
            try {
                detail = JSON.stringify(err);
            } catch {
                detail = String(err);
            }
        }

        return {
            message: message || "Unknown error",
            name: err?.name,
            type: err?.type || err?.code || err?.errorCode,
            detail,
            stack: err?.stack,
            source: err?.source || source,
            timestamp: timestamp,
            cause: err?.cause ? toAppError(err.cause) : undefined,
            properties: combinedProperties,
            [$isAppError]: true
        };
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
