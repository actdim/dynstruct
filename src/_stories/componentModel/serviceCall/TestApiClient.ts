export type DataItem = {
    id: number;
    name: string;
};

// extends ClientBase?
export class TestApiClient {
    static readonly name = 'TestApiClient' as const;
    readonly name = 'TestApiClient' as const;

    getDataItems(param1: number[], param2: string[]) {
        return new Promise<DataItem[]>((res, rej) => {
            setTimeout(() => {
                res(
                    param1.map((id, index) => ({
                        id,
                        name: param2[index] ? param2[index] : `item-${id}`,
                    })),
                );
            }, 200);
        });
    }

    extraMethod() {

    }
}
