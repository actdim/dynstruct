import { describe, it, expect } from 'vitest';
import { getResponseResult, type IRequestState, type IResponseState } from '@/net/request';

// bug--empty-response-body: a response without a body resolves to undefined instead of failing to parse JSON.

const jsonRequest = { contentType: 'application/json', headers: {} } as unknown as IRequestState;

describe('getResponseResult', () => {
    it('resolves a 204 No Content to undefined', async () => {
        const response = new Response(null, { status: 204 }) as IResponseState;
        await expect(getResponseResult(response, jsonRequest)).resolves.toBeUndefined();
    });

    it('resolves an empty 200 with Content-Length 0 to undefined', async () => {
        const response = new Response('', { status: 200, headers: { 'content-length': '0' } }) as IResponseState;
        await expect(getResponseResult(response, jsonRequest)).resolves.toBeUndefined();
    });

    it('still parses JSON bodies', async () => {
        const response = new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        }) as IResponseState;
        await expect(getResponseResult(response, jsonRequest)).resolves.toEqual({ ok: true });
    });
});
