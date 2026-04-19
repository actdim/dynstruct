import { BaseAppContext } from "@/appDomain/appContracts";
import { ClientBase } from "@/net/client";
import { IRequestCallbacks } from "@/net/request";

export class SecureApiClient extends ClientBase {
    static readonly name = "SecureApiClient" as const;
    readonly name = "SecureApiClient" as const;
    constructor(configuration: BaseAppContext, baseUrl?: string) {
        super(configuration);
    }    
    
    getData(param: string, callbacks?: IRequestCallbacks<string>): Promise<string[]> {
        let url = "https://httpbin.org/post";        

        const options_ = {                
            url: url,
            useAuth: true,
            contentType: "application/json",
            method: "POST",
            headers: {
            },
            callbacks: callbacks
        }        
		return this.fetchAsync(options_);
    }
}