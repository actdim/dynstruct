import { BaseAppContext } from "@/componentModel/contracts";
import { HttpClient } from "@/net/httpClient";
import { IRequestCallbacks } from "@/net/request";

type FakerTextItem = { content: string };
type FakerApiResponse = { data: FakerTextItem[] };

export async function requestFakeData() {
    const response = await fetch(
        'https://fakerapi.it/api/v1/texts?_quantity=5&_characters=50',
    );
    const json = (await response.json()) as FakerApiResponse;
    return json.data.map((item) => item.content);
}

export class TestApiClient extends HttpClient {
    static readonly name = "TestApiClient" as const;
    readonly name = "TestApiClient" as const;
    constructor(configuration: BaseAppContext, baseUrl?: string) {
        super(configuration);
    }

    getData(param: string, callbacks?: IRequestCallbacks<string>): Promise<string[]> {
        return requestFakeData();
    }
}