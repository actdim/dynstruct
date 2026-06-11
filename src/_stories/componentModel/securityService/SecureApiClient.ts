import { BaseAppContext } from "@/componentModel/contracts";
import { HttpClient } from "@/net/httpClient";
import { IRequestCallbacks } from "@/net/request";

export class SecureApiClient extends HttpClient {
    static readonly name = "SecureApiClient" as const;
    readonly name = "SecureApiClient" as const;
    constructor(configuration: BaseAppContext, baseUrl?: string) {
        super(configuration);
    }

    getData(param: string, callbacks?: IRequestCallbacks<string>): Promise<unknown> {
        return this.fetch({
            url: `https://jsonplaceholder.typicode.com/posts/1`,
            useAuth: true,
            contentType: "application/json",
            method: "GET",
            headers: {},
            callbacks: callbacks,
        });
    }
}